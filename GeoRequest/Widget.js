define([
  'dojo/_base/declare','dijit/_WidgetsInTemplateMixin','dojo/_base/html','jimu/BaseWidget','jimu/dijit/DrawBox','dojo/request'
], function(
  declare, _WidgetsInTemplateMixin,html,BaseWidget,DrawBox,request) {
    return declare([BaseWidget, _WidgetsInTemplateMixin], {
        //these two properties are defined in the BaseWiget
        baseClass: 'ChangeApp',
        name: 'ChangeApp',
        // add additional properties here
        translation: function () {
            var t = {
            };
            return t;
        },

        postCreate: function () {
            this.inherited(arguments);
            this._initDrawBox();
        },

        startup: function () {
            this.inherited(arguments);
        },

        onOpen: function () {
            this._onCbxUseMapExtentClicked();
            this.request.value = "";
        },

        onClose: function () {
        },
        displayResults: function(){
            var stralert = "Δεν έχετε συμπληρώσει \n";
            var details= "";
            if(this.FName.value == "")
            {
                details += "Name\n";
            }
            if(this.LName.value == "")
            {
                details += "Last Name\n";
            }
            if(this.Phone.value == "")
            {
                details += "Phone\n";
            }
            if(this.email.value == "")
            {
                details += "e-mail\n";
            }
            if(this.address.value == "")
            {
                details += "Address\n";
            }
            if(this.request.value == "")
            {
                details += "Application Description\n";
            }
            if(this.street.value == "")
            {
                details += "Street Name\n";
            }
            if(this.number.value == "")
            {
                details += "Number\n";
            }
            if(this.area.value == "")
            {
                details += "Area\n";
            }
            if(this.dd.value == "")
            {
                details += "Prefecture\n";
            }
            if(details != "")
            {
                alert(stralert + details);
            }
            else
            {
                var geometry = this.getGeometry();

                var postdata ={};

                if(geometry == null) {
                    postdata = {
                        FName: this.FName.value,
                        LName: this.LName.value,
                        Phone: this.Phone.value,
                        email: this.email.value,
                        address: this.address.value,
                        request: this.request.value,
                        street: this.street.value,
                        number: this.number.value,
                        area: this.area.value,
                        dd: this.dd.value
                    };
                }
                else
                {
                    postdata = {
                        FName: this.FName.value,
                        LName: this.LName.value,
                        Phone: this.Phone.value,
                        email: this.email.value,
                        address: this.address.value,
                        request: this.request.value,
                        street: this.street.value,
                        number: this.number.value,
                        area: this.area.value,
                        dd: this.dd.value,
                        geom: JSON.stringify(geometry.toJson())
                    };
                }
                //send data to server
                request.post("../api/values/PostRequest",{
                    data: postdata,
                    handleAs: "json"
                }).then(
                    function (response) {
                        alert(response);
                    },
                    function (error) {
                        alert(error);
                    });
            }
        },
        getGeometry: function(){
            if(this.cbxUseMapExtent.checked) {
            return this.map.extent;
            }
            if(this.cbxnoGraphic.checked) {
                return null;
            }
            if(this.cbxDrawGraphic.checked) {
                var gs = this.drawBox.drawLayer.graphics;
                if(gs.length > 0){
                    var g = gs[0];
                    return g.geometry;
                }
            }
            },
        _onCbxUseMapExtentClicked: function() {
            if(this.cbxUseMapExtent.checked){
                this._resetDrawBox();
                html.setStyle(this.drawBoxDiv, 'display', 'none');
                this.cbxDrawGraphic.checked = false;
                this.cbxnoGraphic.checked = false;
            }
        },
        _onCbxDrawGraphicClicked: function(){
            if(this.cbxDrawGraphic.checked){
                html.setStyle(this.drawBoxDiv, 'display', 'block');
                this.cbxUseMapExtent.checked = false;
                this.cbxnoGraphic.checked = false;
            }
        },
        _onCbxDescriptionClicked: function(){
            if(this.cbxnoGraphic.checked){
                this._resetDrawBox();
                html.setStyle(this.drawBoxDiv, 'display', 'none');
                this.cbxDrawGraphic.checked = false;
                this.cbxUseMapExtent.checked = false;
            }
        },
        _resetDrawBox: function(){
            this.drawBox.deactivate();
            this.drawBox.clear();
        },
        _initDrawBox: function(){
            this.drawBox = new DrawBox({
                types: ['polygon'],
                map: this.map,
                showClear: true,
                keepOneGraphic: true
            });
            this.drawBox.placeAt(this.drawBoxDiv);
            this.drawBox.startup();
        }
    });
});