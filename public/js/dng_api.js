// Copyright IBM Corp. 2025
const DNG_IDENTIFIER = 'http://purl.org/dc/terms/identifier';
const DNG_PRIMARY_TEXT = 'http://www.ibm.com/xmlns/rdm/types/PrimaryText'
const DNG_TITLE = 'http://purl.org/dc/terms/title';

$(document).ready(function () {
    try {
        if (RM != null) {
            RM.Event.subscribe(RM.Event.ARTIFACT_SELECTED, function (selected) {
                console.log('artifact selected: ' + selected)
                DNG._selection_change(selected);
            });

            //ARTIFACT_OPENED
            RM.Event.subscribe(RM.Event.ARTIFACT_OPENED, function (selected) {
                console.log('artifact open: ' + selected)
                DNG._artifact_open(selected);
            });
            RM.Event.subscribe(RM.Event.ARTIFACT_CLOSED, function (selected) {
                console.log('artifact close: ' + selected)
                DNG._artifact_close();
            });

            //ARTIFACT_SAVED
            RM.Event.subscribe(RM.Event.ARTIFACT_SAVED, function (selected) {
                console.log('artifact saved: ' + selected)
                DNG._selection_change(selected);
            });
        }
    }
    catch (error) {
        console.log('RM is undefined!')
    }

});



class DNG_LIB {
    SELECTION_CHANGE = "selection_change";
    MODULE_CHANGE = "module_change";
    TARGET_MODULE_CHANGE = "target_module_change";

    constructor() {
        this.listeners = new Set();
        this.selected_module = null;
        this.selected_artifacts = [];
        this.id_to_ref = new Map();
        this.target_modules = [];
    }

    on_event(callback) {
        if (!this.listeners.has(callback)) {
            this.listeners.add(callback);
            // console.log(callback);
        }
    }

    get_open_module() {
        return this.selected_module;
    }

    get_selected_artifacts() {
        return this.selected_artifacts;
    }

    get_target_modules() {
        this.target_modules.sort(function (a, b) {
            return a.id - b.id;
        });
        return this.target_modules;
    }

    async get_module_requirements_async(module_ref) {
        var _this = this;
        return new Promise((resolve, reject) => {
            _this.get_module_requirements(module_ref, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            })
        });
    }

    get_module_requirements(module_ref, cb) {
        RM.Data.getContentsAttributes(module_ref, [RM.Data.Attributes.IDENTIFIER, RM.Data.Attributes.PRIMARY_TEXT, RM.Data.Attributes.ARTIFACT_TYPE], function (result) {
            if (result.code !== RM.OperationResult.OPERATION_OK) {
                cb({ "error": "RM Operation failed" }, null);
                return;
            }
            var results = [];
            result.data.forEach(function (item) {
                var id = item.values[RM.Data.Attributes.IDENTIFIER];
                var text = $(item.values[RM.Data.Attributes.PRIMARY_TEXT]).text();
                var type = item.values[RM.Data.Attributes.ARTIFACT_TYPE].name;

                var url = item.ref.uri;
                results.push({ "id": id, "url": url, "text": text, "type": type, "ref": item.ref });
            });
            cb(null, results);
        });
    }
    get_attribute_types(cb) {
        var _this = this;
        var all_result = [];
        _this._get_type_resource(function (err, response) {
            if (!err) {
                $(response).find('rm\\:ObjectType').each(function (ot) {
                    all_result.push({ 'name': $(this).find('dcterms\\:title')[0]['textContent'], 'uri': this.attributes[0]['nodeValue'] })
                });
            }
            cb(err, all_result);
        });
    }



    _artifact_open(artifact) {
        var _this = this;
        _this.selected_artifacts = [];
        _this.selected_module = null;
        _this.target_modules = [];
        _this.id_to_ref = new Map();
        if (artifact.format.endsWith(RM.Data.Formats.MODULE)) {
            _this.get_module_info(artifact, function (err, selected) {
                if (!err) {
                    _this.selected_module = selected;
                }
                _this._trigger_selection_change(_this.SELECTION_CHANGE);
                _this._trigger_selection_change(_this.MODULE_CHANGE);
            });
        }
    }

    _artifact_close() {
        var _this = this;
        _this.selected_artifacts = [];
        _this.selected_module = null;
        _this.id_to_ref = new Map();
        _this._trigger_selection_change(_this.SELECTION_CHANGE);
        _this._trigger_selection_change(this.MODULE_CHANGE);
    }

    _selection_change(artifacts) {
        // console.log("selection_change");
        var _this = this;
        if (_this.selected_module != null) {
            if (artifacts.length == 0) {
                _this.selected_artifacts = [];
                _this._trigger_selection_change(_this.SELECTION_CHANGE);
                // console.log("selection_change 1");
            }
            else {
                _this.get_requirements_info(artifacts, function (err, selected) {
                    if (!err) {
                        _this.selected_artifacts = selected;
                        // console.log("selection_change 2");
                    }
                    _this._trigger_selection_change(_this.SELECTION_CHANGE);
                    // console.log("selection_change 3");
                });
            }
        }
    }

    _trigger_selection_change(event_type) {
        this.listeners.forEach(function (item) {
            item(event_type);
        });
    }


    get_module_info(module, cb) {
        var _this = this;
        _this.get_id_title(module, function (err, r) {
            if (!err && r.length == 1) {
                cb(null, r[0]);
            }
            else {
                cb({ 'error': 'error in get_module_info' }, null);
            }
        });
    }

    get_id_title(resources, cb) {
        var _this = this;
        RM.Data.getAttributes(resources, [RM.Data.Attributes.IDENTIFIER, RM.Data.Attributes.NAME], function (opResult) {
            if (opResult.code !== RM.OperationResult.OPERATION_OK) {
                //reportError(opResult);
                cb({ 'error': 'error in get_id_title' }, null);
            }
            else {
                var selected = [];
                opResult.data.forEach(function (item, index) {
                    selected.push({ 'id': item.values[DNG_IDENTIFIER], 'title': item.values[DNG_TITLE], 'ref': item.ref });
                    _this.id_to_ref.set(item.values[DNG_IDENTIFIER], item.ref);
                });
                cb(null, selected);
            }
        });
    }

    get_requirements_info(artifacts, cb) {
        var _this = this;
        RM.Data.getAttributes(artifacts, [RM.Data.Attributes.IDENTIFIER, RM.Data.Attributes.NAME, RM.Data.Attributes.PRIMARY_TEXT], function (opResult) {
            if (opResult.code !== RM.OperationResult.OPERATION_OK) {
                reportError(opResult);
                cb({ 'error': 'error in get_requirements_info' }, null);
            }
            else {
                var selected = [];
                opResult.data.forEach(function (item, index) {
                    selected.push({ 'id': item.values[DNG_IDENTIFIER], 'text': $(item.values[RM.Data.Attributes.PRIMARY_TEXT]).text(), 'ref': item.ref });
                    _this.id_to_ref.set(item.values[DNG_IDENTIFIER], item.ref);
                });
                cb(null, selected);
            }
        });
    }
}
var DNG = new DNG_LIB(); 