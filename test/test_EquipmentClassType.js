var should = require("should");

var construct_ISA95_addressSpace = require("./helpers/bootstrap").construct_ISA95_addressSpace;
var opcua = require("node-opcua");

describe("ISA95 ",function() {

    var addressSpace = null;

    before(function(done) {
        construct_ISA95_addressSpace(function(err,r){
            addressSpace=r;
            done(err);
        });
    });

    after(function(){
        if (addressSpace) {
            addressSpace.dispose();
            addressSpace = null;
        }
    });

    describe("ISA95 Common services",function() {

        it("should extend the model with new methods dedicated to IS95",function() {
            // ISA object must be enriched with useful ISA95 helper method
            opcua.AddressSpace.prototype.addISA95ClassProperty.should.be.instanceOf(Function);
            opcua.AddressSpace.prototype.findISA95ObjectType.should.be.instanceOf(Function);

        });

    });
    describe("Equipment class Type",function() {

        it("should extend the model with new methods dedicated to IS95 Equipment",function() {

            opcua.AddressSpace.prototype.addEquipmentClassType.should.be.instanceOf(Function);
            opcua.AddressSpace.prototype.addEquipmentType.should.be.instanceOf(Function);
            opcua.AddressSpace.prototype.addEquipment.should.be.instanceOf(Function);

        });

        it("should create a equipment class Type",function() {

            var myEquipmentClassType = addressSpace.addEquipmentClassType({
                browseName:"MyEquipmentClassType"
            });
            myEquipmentClassType.browseName.toString().should.eql("MyEquipmentClassType");
            myEquipmentClassType.subtypeOfObj.browseName.toString().should.eql("1:EquipmentClassType");

            addressSpace.addISA95ClassProperty({
                ISA95ClassPropertyOf: myEquipmentClassType,
                typeDefinition: "ISA95ClassPropertyType",
                browseName: "Pressure",
                dataType: "Double"
            });

            var hasISA95ClassProperty = addressSpace.findISA95ReferenceType("HasISA95ClassProperty");
            hasISA95ClassProperty.browseName.toString().should.eql("1:HasISA95ClassProperty");

            var refs = myEquipmentClassType.findReferencesEx(hasISA95ClassProperty,opcua.browse_service.BrowseDirection.Forward);
            refs.length.should.eql(1," it should find 1 HasISA95ClassProperty reference");

            var refs = myEquipmentClassType.findReferencesExAsObject(hasISA95ClassProperty,opcua.browse_service.BrowseDirection.Forward);
            refs.length.should.eql(1," it should find 1 HasISA95ClassProperty reference");


        });

        it("should instantiate a equipment class Type, instance object must expose the same property as its class",function() {

            var EquipmentLevel = opcua.ISA95.EquipmentLevel;

            var myEquipmentClassType = addressSpace.addEquipmentClassType({
                browseName:"MyEquipment2ClassType",
                equipmentLevel: EquipmentLevel.Other
            });

            var myEquipmentClassType = addressSpace.findObjectType("MyEquipment2ClassType");

            var equipment = addressSpace.addEquipment({
                browseName: "MyEquipment",
                definedByEquipmentClass:myEquipmentClassType
            });
            equipment.browseName.toString().should.eql("MyEquipment");

            equipment.definedByEquipmentClass.length.should.eql(1);
            equipment.definedByEquipmentClass[0].browseName.toString().should.eql("MyEquipment2ClassType");

            equipment.typeDefinitionObj.browseName.toString().should.eql("1:EquipmentType");

            equipment.equipmentLevel.readValue().value.value.should.eql(EquipmentLevel.Other.value);
            //xx console.log(equipment.toString())
            // todo
        });

        it("should create nested equipments",function() {

            var EquipmentLevel = opcua.ISA95.EquipmentLevel;

            var myEquipmentClassType = addressSpace.addEquipmentClassType({
                browseName:"MyEquipment3ClassType",
                equipmentLevel: EquipmentLevel.Other
            });

            var equipment1 = addressSpace.addEquipment({
                browseName: "MyEquipment1",
                definedByEquipmentClass:myEquipmentClassType
            });

            var equipment2 = addressSpace.addEquipment({
                browseName: "MyEquipment2",
                containedByEquipment: equipment1,
                definedByEquipmentClass:myEquipmentClassType
            });

            var equipment3 = addressSpace.addEquipment({
                browseName: "MyEquipment3",
                containedByEquipment: equipment1,
                definedByEquipmentClass:myEquipmentClassType
            });

            equipment2.containedByEquipment.should.eql(equipment1);
            equipment3.containedByEquipment.should.eql(equipment1);

            equipment1.madeUpOfEquipments().length.should.eql(2);

            equipment2.madeUpOfEquipments().length.should.eql(0);
            equipment3.madeUpOfEquipments().length.should.eql(0);
        })
    });
    describe("Complete Model",function(){

        var createEquipmentClassTypes = require("./helpers/isa95_demo_address_space").createEquipmentClassTypes;

        before(function() {
            createEquipmentClassTypes(addressSpace);

        });

        it("should instantiate a MixingReactor",function(){

            var mixingReactorClassType = addressSpace.findObjectType("MixingReactorClassType");
            mixingReactorClassType.browseName.toString().should.eql("MixingReactorClassType");


        });

        it("should instantiate a demo mode",function () {
            var instantiateSampleISA95Model = require("./helpers/isa95_demo_address_space").instantiateSampleISA95Model;
            instantiateSampleISA95Model(addressSpace);
        })

    });
});

