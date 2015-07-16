define([
  'dojo/_base/declare','dijit/_WidgetsInTemplateMixin','dojo/_base/html','jimu/BaseWidget','esri/InfoTemplate','dojo/on',
  'dojo/_base/lang','esri/geometry/Point','esri/geometry/Polygon','dojo/_base/query','esri/tasks/QueryTask',
  'esri/tasks/IdentifyTask','esri/tasks/IdentifyParameters','dojo/_base/array','dijit/layout/TabContainer',
  'dijit/layout/ContentPane','dijit/form/Button','esri/symbols/SimpleLineSymbol','esri/Color','esri/layers/GraphicsLayer',
  'esri/geometry/Polyline','esri/graphic','esri/lang','jimu/utils','dojo/request','dijit/TitlePane','esri/renderers/SimpleRenderer',
  'esri/layers/FeatureLayer','esri/symbols/jsonUtils','dojo/Deferred'

], function(
  declare, _WidgetsInTemplateMixin,html,BaseWidget,InfoTemplate,on,lang,Point,Polygon,query,
  QueryTask,IdentifyTask,IdentifyParameters,array,TabContainer,ContentPane,Button,
  SimpleLineSymbol, Color,GraphicsLayer,Polyline, Graphic, esriLang, jimuUtils,
  request,TitlePane,SimpleRenderer,FeatureLayer,symbolJsonUtils,Deferred) {
    return declare([BaseWidget, _WidgetsInTemplateMixin], {
        //these two properties are defined in the BaseWiget
        baseClass: 'say-hello',
        name: 'Identify',
        idgraphiclayer: new GraphicsLayer(),
        // add additional properties here
        translation: function () {
            var t = {
                inspireid: "Κωδικός Inspire",
                basenamegr: "Όνομα",
                basenameen: "Λατινική Ονομασία",
                code: "Κωδικός",
                code2: "Κωδικός 2",
                existsbefore1923: "Προ 1923",
                isoutsideplanning: "Εκτός Σχεδίου"
            };
            return t;
        },
        postCreate: function () {
            this.inherited(arguments);
            console.log('SayHello::postCreate', arguments);
        },

        // start up child widgets
        startup: function () {
            this.inherited(arguments);
            this.map.addLayer(this.idgraphiclayer);
            console.log('SayHello::startup', arguments);
        },

        onMapClick: function (evt) {
            console.log('mapclick', arguments);
            this.inherited(arguments);
            var point = new Point(evt.mapPoint.x, evt.mapPoint.y, this.map.spatialReference);

            this._query("", point).then(lang.hitch(this, function (response) {
                if (response.length > 0) {
                    this._initTabs(response);
                }
            }), lang.hitch(this, function (err) {
                console.error(err);
            }));
        },

        onOpen: function () {
            console.log('SayHello::onOpen', arguments);
            this._clickEvent = this.own(on(this.map, "click", lang.hitch(this, this.onMapClick)));
        },

        onClose: function () {
            this.map.infoWindow.hide();
            this._clickEvent[0].remove();
        },
        _query: function (where, geometry) {
            var queryParams = new IdentifyParameters();
            if (geometry) {
                queryParams.geometry = geometry;
            }
            queryParams.outSpatialReference = this.map.spatialReference;
            queryParams.returnGeometry = true;
            queryParams.tolerance = 6;
            queryParams.mapExtent = this.map.extent;
            queryParams.layerOption = IdentifyParameters.LAYER_OPTION_ALL;

            var str = this.config.layerInfos[1].layer.url;
            var lastIndex = str.lastIndexOf('/');
            var mapserver = str.substring(0, lastIndex);
            var queryTask = new IdentifyTask(mapserver);
            return queryTask.execute(queryParams);
        },
        _initTabs: function (item) {
            this._clearResultPage();
            html.setStyle(this.queryResults, 'display', 'block');
            var tr = this.translation();
            this._createQueryResultLayer(item);
            array.forEach(item, lang.hitch(this, function (feature, i) {
                var trClass = '';
                if (i % 2 === 0) {
                    trClass = 'even';
                }
                else {
                    trClass = 'odd';
                }

                var options = {
                    feature: feature,
                    titleTemplate: feature.layerName,
                    trClass: trClass
                };

                var feature = options.feature;
                var titleTemplate = options.titleTemplate;
                var trClass = options.trClass;

                var attributes = feature.feature.attributes;
                if (!attributes) {
                    return;
                }

                var strItem = '<tr class="query-result-item" cellpadding="0" cellspacing="0">' +
                    '<td><span class="result-item-title"></span>' +
                    '<table class="feature-attributes" valign="top">' +
                    '<tbody></tbody></table></td></tr>';
                var trItem = html.toDom(strItem);
                html.addClass(trItem, trClass);
                html.place(trItem, this.resultsTbody);
                trItem.feature = feature;
                var spanTitle = query("span.result-item-title", trItem)[0];
                var tbody = query("tbody", trItem)[0];
                var title = esriLang.substitute(attributes, titleTemplate);
                if (!title) {
                    title = this.nls.noValue;
                }
                spanTitle.innerHTML = title;
                var infoTemplateContent = '';
                var rowsStr = "";

                for (var property in attributes) {
                    if (attributes.hasOwnProperty(property)) {

                        var fieldName = property;
                        var fieldValue = attributes[property];

                        var fieldValueInWidget = fieldValue;
                        var fieldValueInPopup = fieldValue;

                        if (tr[fieldName]) {
                            var strFieldTr = '<tr><td class="attr-name">' + tr[fieldName] +
                                ':</td><td class="attr-value">' + fieldValueInWidget + '</td></tr>';
                            var fieldTr = html.toDom(strFieldTr);
                            html.place(fieldTr, tbody);
                        }

                        if (tr[fieldName]) {
                            var rowStr = '<tr valign="top">' +
                                '<td class="attr-name">' + tr[fieldName] + '</td>' +
                                '<td class="attr-value">' + fieldValueInPopup + '</td>' +
                                '</tr>';
                            rowsStr += rowStr;
                        }
                    }
                }

                var par="";
                if (attributes['spbuildinglineidid']) {
                    par = attributes['spbuildinglineidid'];
                }
                if (attributes['spurbanblockidid']) {
                    par = attributes['spurbanblockidid'];
                }
                if (attributes['sproadsegmentidid']) {
                    par = attributes['sproadsegmentidid'];
                }
                if (attributes['sppropertylineidid']) {
                    par = attributes['sppropertylineidid'];
                }

                if(par!="") {
                    request.get("../api/values/GetConnectedFiles/" + par + "/" + feature.layerName).then(
                        function (response) {
                            var combitems = JSON.parse(response);
                            array.forEach(combitems.Documents, lang.hitch(this, function (docs, i) {
                                var trNode = html.create('tr');
                                var tdNode = html.create('td',{colspan: 2},trNode);
                                var relationContainter = html.create('div');
                                var titlePane = new TitlePane({
                                    title: 'Συσχετιζόμενα αρχεία',
                                    content: relationContainter,
                                    open: false,
                                    'class': 'relationship-attr'
                                });
                                titlePane.placeAt(tdNode);
                                html.place(trNode, tbody);
                                var strFieldTr = '<span>' +docs['Filename'] + '</span><br/>' +
                                    '<a target="_blank" style="text-decoration: none; color: black" href="..'+
                                    docs['Filepath']+ docs['Filename']
                                    +'"> <button dojoType="dijit.form.Button" type="button"id="items">Λήψη</button></a>';
                                var fieldTr = html.toDom(strFieldTr);
                                html.place(fieldTr, relationContainter);
                            }));
                            array.forEach(combitems.MapSheetFiles, lang.hitch(this, function (maps, i) {
                                var trNode = html.create('tr');
                                var tdNode = html.create('td',{colspan: 2},trNode);
                                var relationContainter = html.create('div');
                                var titlePane = new TitlePane({
                                    title: 'Συσχετιζόμενοι χάρτες',
                                    content: relationContainter,
                                    open: false,
                                    'class': 'relationship-attr'
                                });
                                titlePane.placeAt(tdNode);
                                html.place(trNode, tbody);
                                var strFieldTr = '<span>' +maps['Filename'] + '</span><br/>' +
                                    '<a target="_blank" style="text-decoration: none; color: black" href="..'+
                                    maps['Filepath']+ maps['Filename']
                                    +'"> <button dojoType="dijit.form.Button" type="button"id="items">Λήψη</button></a>';
                                var fieldTr = html.toDom(strFieldTr);
                                html.place(fieldTr, relationContainter);
                            }));
                        });
                }

                infoTemplateContent = '<div class="header">' + title + '</div>';

                if (rowsStr) {
                    infoTemplateContent += '<div class="hzLine"></div>';
                    infoTemplateContent += '<table class="query-popup-table" cellpadding="0" cellspacing="0">' +
                        '<tbody>' + rowsStr + '</tbody></table>';
                }

                infoTemplateContent = '<div class="query-popup">' + infoTemplateContent + '</div>';

                trItem.infoTemplateContent = infoTemplateContent;
                var infoTemplate = new InfoTemplate();
                //if title is empty, popup header will disappear
                infoTemplate.setTitle('<div class="query-popup-title"></div>');
                infoTemplate.setContent(infoTemplateContent);
                feature.feature.setInfoTemplate(infoTemplate);
            }));
        },
        //common
        _clearResultPage: function(){
            html.empty(this.resultsTbody);
        },
        _onResultsTableClicked: function(event){
            var target = event.target||event.srcElement;
            if(!html.isDescendant(target,this.resultsTable)){
                return;
            }
            var tr = jimuUtils.getAncestorDom(target, lang.hitch(this,function(dom){
                return html.hasClass(dom,'query-result-item');
            }),10);
            if(!tr){
                return;
            }

            this._selectResultTr(tr);

            html.addClass(tr,'selected');
            var feature = tr.feature.feature;
            var geometry = feature.geometry;
            if(geometry){
                var infoContent = tr.infoTemplateContent;
                var geoType = geometry.type;
                var centerPoint,extent;
                var def = null;

                if(geoType === 'point' || geoType === 'multipoint'){
                    var singlePointFlow = lang.hitch(this, function(){
                        def = new Deferred();
                        var maxLevel = this.map.getNumLevels();
                        var currentLevel = this.map.getLevel();
                        var level2 = Math.floor(maxLevel * 2 / 3);
                        var zoomLevel = Math.max(currentLevel, level2);
                        this.map.setLevel(zoomLevel).then(lang.hitch(this, function(){
                            this.map.centerAt(centerPoint).then(lang.hitch(this, function(){
                                def.resolve();
                            }));
                        }));
                    });

                    if(geoType === 'point'){
                        centerPoint = geometry;
                        singlePointFlow();
                    }
                    else if(geoType === 'multipoint'){
                        if(geometry.points.length === 1){
                            centerPoint = geometry.getPoint(0);
                            singlePointFlow();
                        }
                        else if(geometry.points.length > 1){
                            extent = geometry.getExtent();
                            if(extent){
                                extent = extent.expand(1.4);
                                centerPoint = geometry.getPoint(0);
                                def = this.map.setExtent(extent);
                            }
                        }
                    }
                }
                else if(geoType === 'polyline'){
                    extent = geometry.getExtent();
                    extent = extent.expand(1.4);
                    centerPoint = extent.getCenter();
                    def = this.map.setExtent(extent);
                }
                else if(geoType === 'polygon'){
                    extent = geometry.getExtent();
                    extent = extent.expand(1.4);
                    centerPoint = extent.getCenter();
                    def = this.map.setExtent(extent);
                }
                else if(geoType === 'extent'){
                    extent = geometry;
                    extent = extent.expand(1.4);
                    centerPoint = extent.getCenter();
                    def = this.map.setExtent(extent);
                }

                if(def){
                    def.then(lang.hitch(this, function(){
                        if(typeof this.map.infoWindow.setFeatures === 'function'){
                            this.map.infoWindow.setFeatures([feature]);
                        }
                        //if title is empty, popup header will disappear
                        this.map.infoWindow.setTitle('<div class="query-popup-title"></div>');
                        this.map.infoWindow.setContent(infoContent);
                        if(typeof this.map.infoWindow.reposition === 'function'){
                            this.map.infoWindow.reposition();
                        }
                        this.map.infoWindow.show(centerPoint);
                    }));
                }
            }
        },
        _createQueryResultLayer: function(item) {
            var resultLayer = null;

            var symbol = symbolJsonUtils.fromJson({
                "color": [
                    155,
                    187,
                    89,
                    255
                ],
                "width": 2.25,
                "type": "esriSLS",
                "style": "esriSLSSolid"
            });
            var renderer = new SimpleRenderer(symbol);

            this.idgraphiclayer.clear();
            this.idgraphiclayer.setRenderer(renderer);
            array.forEach(item, lang.hitch(this, function (feature, i) {
                this.idgraphiclayer.add(new Graphic(feature.feature.geometry));
            }));
        },
        _selectResultTr: function(tr){
            this._unSelectResultTr();
            this.queryResults.resultTr = tr;
            if(this.queryResults.resultTr){
                html.addClass(this.queryResults.resultTr, 'selected');
            }
        },
        _unSelectResultTr: function(){
            if(this.queryResults.resultTr){
                html.removeClass(this.queryResults.resultTr,'selected');
            }
            this.queryResults.resultTr = null;
        }
    });
});