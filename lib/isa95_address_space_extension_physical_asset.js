var assert = require("assert");
var path = require("path");
var _ = require("underscore");


module.exports = function (opcua) {


    /**
     *
     * Attribute     Value
     * BrowseName    PhysicalAssetClassType
     * IsAbstract    False
     * Subtype of the ISA95ClassType defined in 7.6.2.
     * References                NodeClass     BrowseName         DataType           TypeDefinition                 ModellingRule
     * HasISA95ClassProperty     Variable      <PropertyName>     BaseDataType       PhysicalAssetClassPropertyType OptionalPlaceholder
     * HasISA95Attribute         Variable      Manufacturer                          CompanyType                    Optional
     * HasISA95Attribute         Variable      ModelNumber        String             BaseDataVariableType           Optional
     * TestedByPhysicalAssetTest Object       <TestSpecification>                    PhysicalAssetCapabilityTestSpecificationType
     *
     * @param options
     * @param options.browseName {String/QualifiedName} : the new PhysicalAssetClassType name
     * @param [options.manufacturer {CompanyType}] : the CompanyType
     * @param [options.modelNumber {String} ] : the model Number
     *
     */
    opcua.AddressSpace.prototype.addPhysicalAssetClassType = function(options) {

        assert(options.browseName);
        var addressSpace  = this;

        var physicalAssetClassType = addressSpace.findISA95ObjectType("PhysicalAssetClassType");
        var newPhysicalAssetClassType = addressSpace.addObjectType({
            browseName: options.browseName,
            subtypeOf: physicalAssetClassType
        });

        function addManufacturerAttribute(node,manufacturer) {
            addressSpace.addISA95Attribute({
                ISA95AttributeOf: node,
                typeDefinition: addressSpace.findISA95VariableType("CompanyType"),
                browseName: "Manufacturer",
                dataType: opcua.DataType.String,
                value: { dataType: opcua.DataType.String , value: "manufacturer"},
                modellingRule: "Mandatory"
            });
        }
        // add optional property PhysicalAsset Level
        if (options.manufacturer) {
            addManufacturerAttribute(newPhysicalAssetClassType, options.manufacturer);
        }
        function addModelNumberAttribute(node,modelNumber) {

            assert(typeof modelNumber === "string","expecting modelNumber to be a string");
            addressSpace.addISA95Attribute({
                ISA95AttributeOf: node,
                browseName: "ModelNumber",
                dataType: "String",
                value: {dataType: opcua.DataType.String, value: modelNumber },
                modellingRule: "Mandatory"

            });
        }
        if (options.modelNumber) {
            addModelNumberAttribute(newPhysicalAssetClassType, options.modelNumber);
        }

        return newPhysicalAssetClassType;
    };

    opcua.AddressSpace.prototype.addPhysicalAssetType = function(options) {

        assert(options.browseName);
        var addressSpace  = this;

        var physicalAssetType = addressSpace.findISA95ObjectType("PhysicalAssetType");
        var newPhysicalAssetType = addressSpace.addObjectType({
            browseName: options.browseName,
            subtypeOf: physicalAssetType
        });

        return newPhysicalAssetType;
    };



    function _physicalAsset_madeUpOfPhysicalAssets() {
        var node = this;
        var addressSpace = node.addressSpace;
        var madeUpOfEquipment = addressSpace.findISA95ReferenceType("MadeUpOfPhysicalAsset");
        return node.findReferencesExAsObject(madeUpOfEquipment);
    }

    /**
     * Table 69 – PhysicalAssetType definition
     * Attribute   Value
     * BrowseName  PhysicalAssetType
     * IsAbstract  False
     * References                  NodeClass    BrowseName         DataType          TypeDefinition            ModellingRule
     * Subtype of the ISA95ObjectType defined in 7.6.3.
     * HasISA95Property            Variable    <PropertyName>      BaseDataType      PhysicalAssetPropertyType OptionalPlaceholder
     * MadeUpOfPhysicalAsset       Object      <PhysicalAsset>                       PhysicalAssetType         OptionalPlaceholder
     * TestedByPhysicalAssetTest   Object      <TestSpecification>                   PhysicalAssetCapabilityTestSpecificationType OptionalPlaceholder
     * DefinedByPhysicalAssetClass Object      PhysicalAssetClass                    PhysicalAssetClassType    Optional
     * LocatedIn                   Variables   PhysicalLocation    String            GeoSpatialLocationType    Optional
     * HasISA95Attribute           Variables   FixedAssetId        CDTIdentifier     BaseDataVariableType      Optional
     * HasISA95Attribute           Variables   VendorId            BaseDataType      CompanyType               Optional
     * ImplementationOf            Object      Equipment                             EquipmentType             Optional
     * HasComponent                Variable    AssetAssignment     structure         ISA95AssetAssignmentType  Optional
     *
     *  @param options
     *  @param options.browseName
     *  @param options.description
     *  @param [options.organizedBy]
     *  @param options.definedByPhysicalAssetClass
     *  @param [options.containedByPhysicalAsset {Object}]
     *  @param [options.implementationOf {Equipment} ] razeaze*
     *  @param options.locatedIn {PhysicalLocation} the actual location associated with the instance of this PhysicalAssetType
     *  @param [options.fixedAssetId]     the vendor provided identification number provided with the instance of the
     *                                    PhysicalAssetType. For Example it maybe the serial number associated with device.
     *  @param options.vendorId          the vendor that provides the instance of this PhysicalAssetType. This may be the same
     *                                    as the manufacturer associated with the related class, but it may also be different.
     *                                    For example a system integrator maybe the vendor that provides the PhysicalAssetType,
     *                                    even though it is manufactured by another company.
     * @param options.vendorId.typeDefinition
     * @param options.vendorId.dataType
     * @param options.vendorId.value {Variant}
     * @param [options.organizedBy]
     */
    opcua.AddressSpace.prototype.addPhysicalAsset = function(options) {

        var addressSpace  = this;
        var physicalAssetClassType = addressSpace.findISA95ObjectType("PhysicalAssetClassType");
        assert(physicalAssetClassType);

        var physicalAssetType = addressSpace.findISA95ObjectType("PhysicalAssetType");
        assert(physicalAssetType);

        options.typeDefinition = options.typeDefinition || physicalAssetType;

        // The SourceNode of this ReferenceType shall be an Object of EquipmentType or its subtype.
        assert(options.typeDefinition.isSupertypeOf(physicalAssetType),"TypeDefinition of PhysicalAsset to create shall be of type PhysicalAssetType");

        if (false) {
            var physicalAsset = addressSpace.addObject({
                typeDefinition: options.typeDefinition,
                browseName:    options.browseName,
                description:   options.description,
                organizedBy: options.organizedBy
            });
        }

        var physicalAsset = options.typeDefinition.instantiate({
            browseName:    options.browseName,
            description:   options.description,
            organizedBy: options.organizedBy,
            modellingRule: options.modellingRule
        });


        options.definedByPhysicalAssetClass = options.definedByPhysicalAssetClass || "PhysicalAssetClassType";

        assert(options.definedByPhysicalAssetClass," expecting a definedByPhysicalAssetClass options");
        opcua.ISA95.utils.installDefinedByFooClassReferences({
            node: physicalAsset,
            definedByFooClass :options.definedByPhysicalAssetClass,
            fooClassType: physicalAssetClassType,
            definedByFooClassRef: "DefinedByPhysicalAssetClass",
            fooType: physicalAssetType
        });

        // also add ISA96 Property and ISA95 Attribute that may be defined in type Definition

        if (options.containedByPhysicalAsset) {
            function _addContainedByPhysicalAssetReference(node,physicalAsset) {
                opcua.ISA95.utils._addContainedByFooReference(node,physicalAsset,
                    "PhysicalAssetType","MadeUpOfPhysicalAsset");
            }

            _addContainedByPhysicalAssetReference(physicalAsset,options.containedByPhysicalAsset);
        }
        physicalAsset.madeUpOfPhysicalAssets = _physicalAsset_madeUpOfPhysicalAssets;

        function assert_NodeIsOfTypedefintionCompanyType(node) {
            var addressSpace = node.addressSpace;
            assert(node.constructor.name ==="UAVariable", "node must be a UAVariable");
            var companyType = addressSpace.findISA95VariableType("CompanyType");
            if(!node.typeDefinitionObj.isSupertypeOf(companyType)) {
                throw new Error("node "+ node.browseName.toString() + " must be of type definition CompanyType")
            }
        }
        /**
         *
         * @param instance
         * @param vendorId {UAVariable} of typeDefinition CompanyType
         */

        /**
         *
         * @param instance
         * @param vendorId
         * @param vendorId.typeDefinition
         * @param vendorId.dataType
         * @param vendorId.value {Variant}
         */
        function setVendorId(instance,vendorId) {
            assert(typeof vendorId === "object");
            //xx assert_NodeIsOfTypedefintionCompanyType(vendorId);
            var addressSpace = instance.addressSpace;
            var hasISA95Attribute = addressSpace.findISA95ReferenceType("HasISA95Attribute");

            var companyType = addressSpace.findISA95VariableType("CompanyType");
            vendorId.typeDefinition = vendorId.typeDefinition || companyType;
            if (!vendorId.typeDefinition.isSupertypeOf(companyType)) {
                throw new Error("vendorId.typeDefinition must be of type CompanyType");
            }

            var vendorIdNode = addressSpace.addVariable({
                typeDefinition: vendorId.typeDefinition,
                browseName: "VendorId",
                dataType: vendorId.dataType,
                value: vendorId.value
            });

            instance.addReference({
                referenceType: hasISA95Attribute.nodeId,
                forward: true,
                nodeId: vendorIdNode
            });
            // set vendor Id value
        }
        if (options.vendorId) {

            setVendorId(physicalAsset,options.vendorId,options.vendorIdType);
        }


        if (options.fixedAssetId) {

            assert(typeof options.fixedAssetId === "string");
            var hasISA95Attribute = addressSpace.findISA95ReferenceType("HasISA95Attribute");
            var CDTIdentifier = addressSpace.findISA95DataType("CDTIdentifier");
            assert(CDTIdentifier);

            var fixedAssetIdNode = addressSpace.addVariable({
                typeDefinition: "BaseDataVariableType",
                browseName: "FixedAssetId",
                dataType: CDTIdentifier,
                value: { dataType: opcua.DataType.String, value: options.fixedAssetId}
            });
            physicalAsset.addReference({
                referenceType: hasISA95Attribute.nodeId,
                forward: true,
                nodeId: fixedAssetIdNode
            });
        }
        if (options.implementationOf) {

            // verify that options.implementationOf is of type Equipment
            var equipmentType = addressSpace.findISA95ObjectType("EquipmentType");
            options.implementationOf.typeDefinitionObj.isSupertypeOf(equipmentType);

            var implementationByRef = addressSpace.findISA95ReferenceType("ImplementedBy");

            physicalAsset.addReference({
                referenceType: implementationByRef.nodeId,
                isForward:     false,
                nodeId:        options.implementationOf.nodeId
            });

            // todo turn into a __Getter__
            physicalAsset.implementationOf = options.implementationOf;
        }
        return physicalAsset;
    };

};
