var assert = require("assert");
var path = require("path");
var _ = require("underscore");


module.exports = function (opcua) {

    opcua.ISA95.utils = {};

    var BrowseDirection = opcua.browse_service.BrowseDirection;

    function _coerceISA95ReferenceType(addressSpace,obj) {
        var _coerced = typeof obj === "string" ? addressSpace.findISA95ReferenceType(obj) : obj;
        assert(_coerced,obj + " should exists in ISA95  addressSpace");
        return _coerced;
    }
    function _coerceISA95ObjectType(addressSpace,obj) {
        var _coerced = typeof obj === "string" ? addressSpace.findISA95ObjectType(obj) : obj;
        assert(_coerced,obj.toString() + " should exists in ISA95  addressSpace");
        return _coerced;
    }

    /**
     *
     * @param instance
     * @param FooClassReference
     * @param FooClassType
     * @param type                     must be a subtype Of FooClassType
     * @private
     *
     *
     *     _addDefinedByFooClassReference(instance,"DefinedByEquipmentClass","EquipmentClassType",type);
     *     will:
     *        verify that type is a EquipmentClassType
     *        add to instance, a DefinedByEquipmentClass reference pointing to type
     *        update  instance.definedByEquipmentClass by adding type to it.
     *
     */
    function _addDefinedByFooClassReference(instance,FooClassReference,FooClassType,type) {

        assert(type," expecting a type");
        assert(FooClassReference, "expecting a ClassReference");
        assert(FooClassType, "expecting a FooClassType");
        var addressSpace = instance.addressSpace;


        var definedByEquipmentClass = _coerceISA95ReferenceType(addressSpace,FooClassReference);

        var equipmentClassType = _coerceISA95ObjectType(addressSpace,FooClassType);

        // istanbul ignore next
        if(!type.isSupertypeOf(equipmentClassType)) {
            throw new Error(type.browseName.toString() + " must be of type "+ equipmentClassType.browseName.toString() );
        }

        instance.addReference({
            referenceType: definedByEquipmentClass.nodeId,
            nodeId: type
        });

        // TODO : Add a __Getter__ property and use cache instead ...
        // set definedByEquipmentClass
        var attribute = opcua.utils.lowerFirstLetter(FooClassReference);
        if (!instance[attribute]) {
            instance[attribute] = [];
        }
        instance[attribute].push(type);


    }


    function addDefinedByFooClass(node,definedByFooClass,isa95PropertyType,options) {

        var addressSpace = node.addressSpace;

        var name = opcua.utils.capitalizeFirstLetter(definedByFooClass);
        var attribute = opcua.utils.lowerFirstLetter(definedByFooClass);

        var definedByFooClassReference = addressSpace.findISA95ReferenceType(name);

        options[attribute] = options[attribute] || [];
        if (!_.isArray(options[attribute])) {
            options[attribute] = [options[attribute]];
        }

        function addDefinedByFooClassReference(classType) {

            node.addReference({
                referenceType: definedByFooClassReference.nodeId, nodeId: classType
            });

            // also duplicate all hasIsa95ClassProperty of classType into HasIsa95Property on type
            var hasISA95ClassProperty = addressSpace.findISA95ReferenceType("HasISA95ClassProperty");
            var hasISA95Property = addressSpace.findISA95ReferenceType("HasISA95ClassProperty");
            var refs = classType.findReferencesExAsObject(hasISA95ClassProperty,BrowseDirection.Forward);

            function constructIsa95PropertyFromISA95ClassProperty(reference) {
                var srcProperty = addressSpace.findNode(reference.nodeId);

                // clone property
                var property = addressSpace.addISA95Property({
                    ISA95PropertyOf: node,
                    browseName:  srcProperty.browseName,
                    dataType: srcProperty.dataType,
                    value: srcProperty.readValue().value,
                    typeDefinition: isa95PropertyType
                });
            }
            refs.forEach(constructIsa95PropertyFromISA95ClassProperty);

            //xx console.log("[==>", refs.map(f => f.toString()).join("\n"));
        }
        options[attribute].forEach(addDefinedByFooClassReference);

    }
    opcua.ISA95.utils.addDefinedByFooClass = addDefinedByFooClass;

    /**
     *
     * @param params
     * @param params.node                {UAObject} the node to add the DefinedBy...ClassType reference
     * @param params.definedByFooClass   {String|UAObjectType|[]}
     * @param params.fooClassType
     * @param params.fooType
     * @param params.definedByFooClassRef  = the r i.e "DefinedByEquipmentClass"
     *
     * example :
     *
     */
    opcua.ISA95.utils.installDefinedByFooClassReferences = function(params) {

        assert(params.node);
        var addressSpace = params.node.addressSpace;

        // -------------------------------------------------------------------------------------------------------------
        // Duplicate features defined in definedBy(Equipment|PhysicalAsset)Class
        //
        //    My(Equipment|PhysicalAsset)ClassType                          (Equipment|PhysicalAsset)Type
        //          |                                                            |
        //          |                                               \            +---definedBy(Equipment|PhysicalAsset)Class-->My(Equipment|PhysicalAsset)ClassType
        //          |                                         -------\           |
        //          +-HasISA95ClassProperty-> "Property1"             >          +-HasISA95Property-->"Property1"
        //          |                                         -------/
        //          +- hasSubtypeOf ->                              /
        //                             (Equipment|PhysicalAsset)ClassType
        // -------------------------------------------------------------------------------------------------------------
        // The Object identified by the SourceNode has the same features as that defined by the Object specified by TargetNode.


        if (typeof params.definedByFooClass === "string") {
            var node = addressSpace.findISA95ObjectType(params.definedByFooClass);
            if (!node) {
                throw Error(params.definedByFooClass +" must be a valid ISA95 Class Type");
            }
            params.definedByFooClass = node;
        }
        if (!_.isArray(params.definedByFooClass)) {
            params.definedByFooClass =[params.definedByFooClass];
        }

        if (typeof params.fooClassType === "string") {
            params.fooClassType = addressSpace.findISA95ObjectType(params.fooClassType);
        }
        params.definedByFooClass.forEach(function(xxxxClass){
            // we need to exclude OptionalPlaceHolder
            if (xxxxClass.modellingRule === "OptionalPlaceholder") {
                return;
            }
            assert(xxxxClass.isSupertypeOf(params.fooClassType),"expecting ");

            _addDefinedByFooClassReference(
                params.node,
                params.definedByFooClassRef,  // "DefinedByEquipmentClass"
                params.fooClassType,          // "EquipmentClassType",
                xxxxClass);
        });
    };

    opcua.ISA95.utils._transferISA95Attributes = function (instance,classType) {

        // we need to exclude OptionalPlaceHolder
        if (classType.modellingRule === "OptionalPlaceholder") {
            return;
        }
        assert(classType.constructor.name == "UAObjectType");

        var addressSpace = instance.addressSpace;
        var hasISA95Attribute = addressSpace.findISA95ReferenceType("HasISA95Attribute");

        assert(hasISA95Attribute);
        var refs = classType.findReferencesEx(hasISA95Attribute);

        function constructIsa95AttributeFromISA95Attribute(reference) {
            var attribute = addressSpace.findNode(reference.nodeId);
            var _clone = attribute.clone();

            instance.addReference({
                referenceType: reference.referenceType,
                nodeId: _clone
            });
        }
        refs.forEach(constructIsa95AttributeFromISA95Attribute);

    };

    opcua.ISA95.utils._addContainedByFooReference = function (node,foo,fooType,madeUpOfFoo) {

        var addressSpace = node.addressSpace;
        assert(foo.nodeId instanceof opcua.NodeId);

        assert(typeof fooType === "string");
        var fooType = addressSpace.findISA95ObjectType(fooType);

        assert(typeof madeUpOfFoo === "string");
        var madeUpOfFoo = addressSpace.findISA95ReferenceType(madeUpOfFoo);

        // verify that containedByEquipment is really a equipment !
        var t = foo.typeDefinitionObj;

        //xx console.log(t.toString());
        //xx assert(equipmentType.isSupertypeOf(t),"options.containedByEquipment object must be of EquipmentType");

        node.addReference({
            referenceType: madeUpOfFoo.nodeId,
            isForward:     false,
            nodeId:        foo.nodeId
        });

        var inverseName = madeUpOfFoo.inverseName.text.toString();
        inverseName = opcua.utils.lowerFirstLetter(inverseName);
        // for inestance containedByEquipment
        node[inverseName] = foo;
    }

};
