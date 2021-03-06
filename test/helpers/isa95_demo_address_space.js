var opcua = require("node-opcua");
var _ = require("underscore");

require("../../")(opcua);

var assert = require("assert");
var should = require("should");

exports.createEquipmentClassTypes = function (addressSpace) {

    var EquipmentLevel = opcua.ISA95.EquipmentLevel;

    function defineEnterpriseClassType() {
        var enterpriseClassType = addressSpace.addEquipmentClassType({
            browseName: "EnterpriseClassType",
            equipmentLevel: EquipmentLevel.Enterprise
        });
    }
    function defineEnterpriseSiteClassType() {
        var enterpriseSiteClassType = addressSpace.addEquipmentClassType({
            browseName: "EnterpriseSiteClassType",
            equipmentLevel: EquipmentLevel.Site
        });
    }
    function defineEnterpriseSiteAreaClassType() {
        var enterpriseSiteAreaClassType = addressSpace.addEquipmentClassType({
            browseName: "EnterpriseSiteAreaClassType",
            equipmentLevel: EquipmentLevel.Area
        });
    }
    function defineEnterpriseSiteAreaProductionUnitClassType() {
        var enterpriseSiteAreaProductionUnitClassType = addressSpace.addEquipmentClassType({
            browseName: "EnterpriseSiteAreaProductionUnitClassType",
            equipmentLevel: EquipmentLevel.ProductionUnit
        });
    }
    defineEnterpriseClassType();
    defineEnterpriseSiteClassType();
    defineEnterpriseSiteAreaClassType();
    defineEnterpriseSiteAreaProductionUnitClassType();


    function defineMixingReactorClassType() {

        var mixingReactorClassType = addressSpace.addEquipmentClassType({
            browseName: "MixingReactorClassType",
            equipmentLevel: EquipmentLevel.EquipmentModule
        });

        addressSpace.addISA95ClassProperty({
            ISA95ClassPropertyOf: mixingReactorClassType,
            typeDefinition: "ISA95ClassPropertyType",
            browseName: "Pressure",
            dataType: "Double"
        });
    }

    function defineHeatingReactorClassType() {

        var heatingReactorClassType = addressSpace.addEquipmentClassType({
            browseName: "HeatingReactorClassType",
            equipmentLevel: EquipmentLevel.EquipmentModule
        });

        addressSpace.addISA95ClassProperty({
            ISA95ClassPropertyOf: heatingReactorClassType,
            typeDefinition: "ISA95ClassPropertyType",
            browseName: "Temperature",
            dataType: "Double"
        });
    }

    function defineHeatingMixingReactorType() {

        var heatingReactorClassType = addressSpace.findObjectType("HeatingReactorClassType");
        var mixingReactorClassType = addressSpace.findObjectType("MixingReactorClassType");

        var heatingMixingReactorType = addressSpace.addEquipmentType({
            browseName: "HeatingMixingReactorType",
            equipmentLevel: EquipmentLevel.EquipmentModule,
            definedByEquipmentClass: [
                heatingReactorClassType,
                mixingReactorClassType
            ]
        });


        addressSpace.addISA95ClassProperty({
            ISA95ClassPropertyOf: heatingMixingReactorType,
            typeDefinition: "ISA95ClassPropertyType",
            browseName: "Pressure",
            dataType: "Double"
        });
        addressSpace.addISA95ClassProperty({
            ISA95ClassPropertyOf: heatingMixingReactorType,
            typeDefinition: "ISA95ClassPropertyType",
            browseName: "Temperature",
            dataType: "Double"
        });
    }

    function defineCoordinateMeasuringMachineClassType() {
        var coordinateMeasuringMachineClassType = addressSpace.addEquipmentClassType({
            browseName: "CoordinateMeasuringMachineClassType"
        });
    }

    function defineRobotClassType() {
        var RobotClassType = addressSpace.addEquipmentClassType({
            browseName: "RobotClassType"
        });
    }


    defineMixingReactorClassType();
    defineHeatingReactorClassType();
    defineHeatingMixingReactorType();

    defineCoordinateMeasuringMachineClassType();
    defineRobotClassType();

};


exports.instantiateSampleISA95Model = function(addressSpace) {

    assert(addressSpace instanceof opcua.AddressSpace);

    if (!addressSpace.findObjectType("EnterpriseClassType")) {
        exports.createEquipmentClassTypes(addressSpace);
    }

    var enterpriseClassType = addressSpace.findObjectType("EnterpriseClassType");
    should(enterpriseClassType).not.eql(null);


    var enterprise = addressSpace.addEquipment({
        browseName: "ACME Corporation",
        organizedBy: addressSpace.rootFolder.objects,
        definedByEquipmentClass: enterpriseClassType
    });
    enterprise.definedByEquipmentClass[0].should.eql(enterpriseClassType);

    enterprise.equipmentLevel.readValue().value.value.should.eql(opcua.ISA95.EquipmentLevel.Enterprise.value);

    var enterpriseSiteClassType = addressSpace.findObjectType("EnterpriseSiteClassType");

    var site1 = addressSpace.addEquipment({
        definedByEquipmentClass: enterpriseSiteClassType,
        browseName: "ACME Corporation- Muenchen site",
        // ISA properties
        containedByEquipment: enterprise
    });
    site1.equipmentLevel.readValue().value.value.should.eql(opcua.ISA95.EquipmentLevel.Site.value);

    site1.definedByEquipmentClass[0].should.eql(enterpriseSiteClassType);


    var site2 = addressSpace.addEquipment({
        browseName: "ACME Corporation- Marseille site",
        definedByEquipmentClass: enterpriseSiteClassType,
        // ISA properties
        containedByEquipment: enterprise
    });
    site2.equipmentLevel.readValue().value.value.should.eql(opcua.ISA95.EquipmentLevel.Site.value);

    var equipmentType = addressSpace.findISA95ObjectType("EquipmentType");

    //xx site2.typeDefinition.should.eql(equipmentType);

    site2.definedByEquipmentClass[0].should.eql(enterpriseSiteClassType);

    site2.containedByEquipment.should.eql(enterprise);

    var r = site2.findReferencesEx(addressSpace.findISA95ReferenceType("MadeUpOfEquipment"),opcua.browse_service.BrowseDirection.Inverse);
    r.length.should.eql(1);

    var equipmentClassType = addressSpace.findISA95ObjectType("EquipmentClassType");
    equipmentClassType.browseName.name.toString().should.eql("EquipmentClassType");

    var workUnit1 =addressSpace.addEquipment({
        definedByEquipmentClass: equipmentClassType,
        browseName: "WorkUnit A",
        equipmentLevel: opcua.ISA95.EquipmentLevel.ProductionUnit,
        containedByEquipment: site1
    });

    var equipmentSet1 = addressSpace.addEquipment({
        definedByEquipmentClass: equipmentClassType,
        browseName: "WorkUnit",
        containedByEquipment: workUnit1,
        equipmentLevel: opcua.ISA95.EquipmentLevel.ProcessCell,
        optionals: [ "AssetAssignment" ]
    });


    var heatingMixingReactorClassType = addressSpace.findObjectType("HeatingMixingReactorType");
    assert(heatingMixingReactorClassType.isSupertypeOf(addressSpace.findISA95ObjectType("EquipmentType")));
    var mixer = addressSpace.addEquipment({
        browseName: "MixerA",
        containedByEquipment: equipmentSet1,
        typeDefinition: heatingMixingReactorClassType
    });
    mixer.definedByEquipmentClass.length.should.eql(2);


    var robotClassType = addressSpace.findObjectType("RobotClassType");
    var robot1 = addressSpace.addEquipment({
        browseName: "WeldingRobot",
        containedByEquipment: equipmentSet1,
        definedByEquipmentClass: robotClassType
    });


    function createFanucArcMateRobotType() {
        // add physicalAssets
        var fanuc_robotArcMate = addressSpace.addPhysicalAssetType({
            browseName: "ArcMate 100iB/6S i",
            modelNumber: "ArcMate 100iB/6S i",
            manufacturer: {
                dataType: "String",
                value: { dataType: opcua.DataType.String, value: "Fanuc Inc"}
            }
        });

        addressSpace.addISA95Attribute({
            ISA95AttributeOf: fanuc_robotArcMate,
            browseName: "Weight",
            description: "Robot mass in kg",
            dataType:"Double",
            value: { dataType: opcua.DataType.Double, value: 135 },
            modellingRule: "Mandatory"
        });

        addressSpace.addISA95Attribute({
            ISA95AttributeOf: fanuc_robotArcMate,
            browseName: "Payload",
            description: "Payload in kg",
            dataType:"Double",
            value: { dataType: opcua.DataType.Double, value: 6 },
            modellingRule: "Mandatory"
        });
        addressSpace.addISA95Attribute({
            ISA95AttributeOf: fanuc_robotArcMate,
            browseName: "Repeatability",
            description: "+/-",
            dataType:"Double",
            value: { dataType: opcua.DataType.Double, value: 0.08 },
            modellingRule: "Mandatory"
        });
        addressSpace.addISA95Attribute({
            ISA95AttributeOf: fanuc_robotArcMate,
            browseName: "HReach",
            description: "in mm",
            dataType:"Double",
            value: { dataType: opcua.DataType.Double, value: 1373 },
            modellingRule: "Mandatory"
        });


        var axis = addressSpace.addPhysicalAsset({
            containedByPhysicalAsset: fanuc_robotArcMate,
            definedByPhysicalAssetClass: "PhysicalAssetClassType",
            browseName: "Axis",
            description: "the axis collection",
            modellingRule: "Mandatory"
        });

        /**
         *
         * @param name
         * @param lowRange  in Degree
         * @param highRange in Degree
         * @param maxSpeed  in Degree per second
         */
        function add_join(name,lowRange,highRange,maxSpeed) {
            var join = addressSpace.addPhysicalAsset({
                containedByPhysicalAsset: axis,
                definedByPhysicalAssetClass: "PhysicalAssetClassType",
                browseName: name,
                description:" the axis " + name,
                modellingRule: "Mandatory"
            });
            addressSpace.addISA95Attribute({
                ISA95AttributeOf: join,
                browseName: "RangeLow",
                dataType:"Double",
                value: { dataType: opcua.DataType.Double, value: lowRange },
                modellingRule: "Mandatory"
            });
            addressSpace.addISA95Attribute({
                ISA95AttributeOf: join,
                browseName: "RangeHigh",
                dataType:"Double",
                value: { dataType: opcua.DataType.Double, value: highRange },
                modellingRule: "Mandatory"
            });
        }
        add_join("J1",-170,170  , 150);
        add_join("J2", -90,190  , 160);
        add_join("J3",-170,145  , 170);
        add_join("J4",-190,190  , 400);
        add_join("J5",-140,140  , 400);
        add_join("J6",-360,360  , 520);



        addressSpace.addISA95Attribute({
            ISA95AttributeOf: fanuc_robotArcMate,
            browseName: "Documentation",
            dataType: "String",
            value: { dataType: opcua.DataType.String, value: "https://www.robots.com/fanuc/arcmate-100ib-6s"},
            modellingRule: "Mandatory"
        });

        return fanuc_robotArcMate;
    }

    var fanuc_robotArcMate = createFanucArcMateRobotType(addressSpace);

    // create the physical asset set storage  folder
    // where all our main assets will be listed
    var physicalAssetSet = addressSpace.addObject({
        browseName: "PhysicalAssetSet",
        typeDefinition: "FolderType",
        organizedBy: addressSpace.rootFolder.objects,
    });



    var robot_instance = addressSpace.addPhysicalAsset({
        organizedBy:     physicalAssetSet,
        typeDefinition:  fanuc_robotArcMate,
        definedByPhysicalAssetClass: "PhysicalAssetClassType",
        browseName: "FANUC Arc Mate 100iB/6S i - 001",
        implementationOf: robot1,
        vendorId: {
            dataType: "String",
            value: { dataType: opcua.DataType.String, value: "RobotWox" }
        }
    });


};
