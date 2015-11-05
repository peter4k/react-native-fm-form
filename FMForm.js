'use strict';

var React = require('react-native');
var DeepState = require('../utils/deepState');
var AutoScroll = require('../utils/AutoScroll');
var UIImagePickerManager = require('NativeModules').UIImagePickerManager;
var { Icon, } = require('react-native-icons');

var {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    ListView,
    Image,
    SwitchIOS,
    DeviceEventEmitter,
    } = React;

var SCREEN_WIDTH = require('Dimensions').get('window').width;
var SCREEN_HEIGHT = require('Dimensions').get('window').height;

var IOSBottomPicker = require('../editors/IOSBottomPicker');
var ImageLoadingIndicator = require('../editors/imageLoadingIndicator');

var Component = React.createClass({
    //Set a single field of the data
    setData: function (field, data) {
        this.props.delegate.FMFormData[field] = data;
        this.formShouldReload();
    },
    //Replace the entire FMFormData with the data provided
    setAllData: function (data) {
        this.delegate.FMFormData = data;
        this.formShouldReload();
    },
    //Manually trigger form reload. Used when you changed some value of FMFormData manually
    formShouldReload: function () {
        var schema = this.props.schema;
        if (typeof schema == 'function') schema = schema();
        this.setState({dataSource: this.state.dataSource.cloneWithRows(schema)});
    },
    componentWillMount: function () {
        if (this.props.schema == null) throw new Error('Schema is required for FMForm');
        if (this.props.delegate == null) throw new Error('Delegate is required for FMForm');
        if (this.props.initData){
            this.props.delegate.FMFormData = (this.props.hardCopyData == false) ? this.props.initData : JSON.parse(JSON.stringify(this.props.initData));
            if (this.props.delegate.FMFormData.id){
                delete this.props.delegate.FMFormData.id;
                delete this.props.delegate.FMFormData.className;
                delete this.props.delegate.FMFormData.objectId;
                delete this.props.delegate.FMFormData.createdAt;
                delete this.props.delegate.FMFormData.updatedAt;
            }
        }
        if (!this.props.delegate.FMFormData) this.props.delegate.FMFormData = {};
        var self = this;
        var schema = (typeof this.props.schema == 'function') ? this.props.schema() : this.props.schema;
        var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
        this.setState({dataSource: ds.cloneWithRows(schema)});
        this.counters = {
            picker: 0,
            textInput: 0,
        }
        this.FMRefs = {
            picker: [],
            textInput: [],
        }
        this.listViewRefs = {};
        //Set up auto scroll
        this.previousScrollOffset = 0;
        this.keyBoardHeight = 0;
        if (this._keyboardWillShowSubscription) this._keyboardWillShowSubscription.remove();
        this._keyboardWillShowSubscription = DeviceEventEmitter.addListener('keyboardWillShow', (e) => {
            self.keyBoardHeight = e.endCoordinates.height;
        });
        if(this.props.onFormRender) this.props.onFormRender();
    },
    _onScroll: function (event) {
        this.previousScrollOffset = event.nativeEvent.contentOffset.y;
    },
    render: function () {
        return (
            <ListView
                style={[{flex: 1}, this.props.style]}
                ref={'listView'}
                dataSource={this.state.dataSource}
                renderRow={this._renderRow}
                keyboardDismissMode="on-drag"
                scrollEventThrottle={8}
                onScroll={this._onScroll}
                />
        );
    },
    _renderRow: function (rowData:object, sectionID:number, rowID:number) {

        //If hidden this row
        var hidden = (typeof rowData.hidden == 'function') ? rowData.hidden() : rowData.hidden;
        if (hidden == true) {
            return (
                <View />
            )
        }
        else {
            if (rowData.beforeRender){
                rowData.beforeRender(this.props.delegate.FMFormData[rowData.reference]);
            }
            var fieldValue = this.props.delegate.FMFormData[rowData.reference];;

            var firstSeparator;
            if (rowID == 0 && this.props.beginningSeperator == true) {
                firstSeparator =
                    <View
                        style={{borderColor: '#E6E6E6', borderBottomWidth: 0.5, marginBottom: 15, marginRight: -20}}></View>
            }

            var separator;
            if (rowData.type != 'helpText') {
                separator =
                    <View
                        style={{borderColor: '#E6E6E6', borderBottomWidth: 0.5, marginTop: 15, marginRight: -20}}></View>
            }

            var rowContent = this._renderRowAccessory(rowData, sectionID, rowID, fieldValue);

            if(rowData.onClick || rowData.type == 'select'){
                var self = this;
                var onClick;
                if(rowData.type == 'select'){
                    var pickerId = 'FMpicker' + sectionID + ':' + rowID;
                    onClick = function(){
                        self.listViewRefs[pickerId].show({selectedOption: self.props.delegate.FMFormData[rowData.reference]},
                            function(value){
                                self.props.delegate.FMFormData[rowData.reference] = value;
                                self.formShouldReload();
                            }
                        );
                    }
                }else{
                    onClick = rowData.onClick;
                }
                return(
                    <TouchableOpacity style={styles.row}
                        onPress={()=>{onClick(rowData.reference)}}
                        >
                        <View style={styles.rowContent}>
                            {firstSeparator}
                            {rowContent}
                            {separator}
                        </View>
                    </TouchableOpacity>
                )
            }
            return (
                <View style={styles.row}>
                    <View style={styles.rowContent}>
                        {firstSeparator}
                        {rowContent}
                        {separator}
                    </View>
                </View>
            )
        }
    },
    _renderRowAccessory: function (rowData:object, sectionID:number, rowID:number, fieldValue) {
        if (rowData.accessory) {
            var accessoryName = (typeof rowData.accessory == 'function') ? rowData.accessory() : rowData.accessory;
            var accessoryColor = (typeof rowData.accessoryColor == 'function') ? rowData.accessoryColor() : rowData.accessoryColor;
            var size = 25;
            var marginRight = 0;
            var marginLeft = 15;
            if (rowData.accessorySize) {
                var margin = (size - rowData.iconSize) / 2;
                marginRight += margin;
                marginLeft += margin;
                size = rowData.accessorySize;
            }
            var rowContent = this._renderRowBasedOnType(rowData, sectionID, rowID, fieldValue);

            var onClick = rowData.onAccessoryClick || rowData.onClick;
            if (onClick) {
                return (
                    <TouchableOpacity style={{flexDirection: 'row', alignItems: 'center'}}
                                      onPress={onClick.bind(this, rowData.reference)}>
                        {rowContent}
                        <Icon
                            style={[styles.accessory, {width: size, height: size, marginTop: 0, marginRight: marginRight, marginLeft:marginLeft}]}
                            name={accessoryName}
                            size={size}
                            color={accessoryColor || 'gray'}
                            />
                    </TouchableOpacity>
                )
            } else {
                return (
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        {rowContent}
                        <Icon
                            style={[styles.accessory, {width: size, height: size, marginTop: 0, marginRight: marginRight, marginLeft:marginLeft}]}
                            name={accessoryName}
                            size={size}
                            color={accessoryColor || 'gray'}
                            />
                    </View>
                )
            }
        } else {
            return this._renderRowBasedOnType(rowData, sectionID, rowID, fieldValue);
        }
    },
    _renderRowBasedOnType: function (rowData:object, sectionID:number, rowID:number, fieldValue) {
        if (rowData.type == 'picture') {
            return this._renderPictureRow(rowData, sectionID, rowID, fieldValue);
        }
        else if (rowData.image) {
            return this._renderRowWithImage(rowData, sectionID, rowID, fieldValue);
        } else if (rowData.icon) {
            return this._renderRowWithIcon(rowData, sectionID, rowID, fieldValue);
        } else if (rowData.type == 'custom') {
            return rowData.renderRow(rowData, sectionID, rowID, fieldValue);
        } else {
            return this._renderRowContent(rowData, sectionID, rowID, fieldValue);
        }
    },
    _renderPictureRow: function (rowData:object, sectionID:number, rowID:number, fieldValue) {
        //setUpImage
        var image;
        if (this.props.delegate.FMFormData[rowData.reference]) {
            var source = (typeof fieldValue == 'object') ? {uri: fieldValue.url} : {uri: 'data:image/jpeg;base64,' + fieldValue};
            image = <ImageLoadingIndicator style={[styles.imageWithBorder, {marginTop: 0}]}
                                           source={source}/>
        } else {
            image = <Image style={[styles.icon, {marginTop: 0, tintColor: '#ff9900', height: 35, width: 35}]}
                           source={require('image!empty_photo')}/>
        }

        //setUpLabel
        var label;
        if (this.props.delegate.FMFormData[rowData.reference]) {
            label = <Text style={{marginLeft: 15, color: '#ff9900'}}>
                {rowData.labelWithPicture || '重新选择图片'}
            </Text>
        } else {
            label = <Text style={{marginLeft: 15, color: '#ff9900'}}>
                {rowData.labelWithNoPicture || '选择图片'}
            </Text>
        }

        return (
            <TouchableOpacity
                style={{flexDirection: 'row', alignItems: 'center'}}
                onPress={() => {
                    var self = this;
                    var options = {
                        title: null,
                        cancelButtonTitle: '取消',
                        takePhotoButtonTitle: '拍一张照片',
                        chooseFromLibraryButtonTitle: '从相册中选择一张照片',
                        quality: 1,
                        allowsEditing: true,
                        storageOptions: {
                            skipBackup: true,
                            path: 'tmp/images'
                        }
                    };
                    UIImagePickerManager.showImagePicker(options, (didCancel, response) => {
                        if (!didCancel) {
                            fieldValue = response.data;
                            self.formShouldReload();
                        }
                    });
                }}>
                {image}
                {label}
            </TouchableOpacity>
        )
    },
    _renderRowWithImage: function (rowData:object, sectionID:number, rowID:number, fieldValue) {
        var size = 25;
        var marginRight = 15;
        var marginLeft = 0;
        if (rowData.iconSize) {
            var margin = (size - rowData.iconSize) / 2;
            marginRight += margin;
            marginLeft += margin;
            size = rowData.iconSize || size;
        }
        return (
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Image
                    style={[styles.icon, {width: size, height: size, marginTop: 0, marginRight: marginRight, marginLeft:marginLeft, tintColor: rowData.iconColor || '#ff9900'}]}
                    source={rowData.image}
                    />
                {(() => {
                    return this._renderRowContent(rowData, sectionID, rowID, fieldValue);
                })()}
            </View>
        )
    },
    _renderRowWithIcon: function (rowData:object, sectionID:number, rowID:number, fieldValue) {
        var size = 25;
        var marginRight = 15;
        var marginLeft = 0;
        if (rowData.iconSize) {
            var margin = (size - rowData.iconSize) / 2;
            marginRight += margin;
            marginLeft += margin;
            size = rowData.iconSize;
        }
        return (
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Icon
                    style={[styles.icon, {width: size, height: size, marginTop: 0, marginRight: marginRight, marginLeft:marginLeft}]}
                    name={rowData.icon}
                    size={size}
                    color={rowData.iconColor || '#ff9900'}
                    />
                {(() => {
                    return this._renderRowContent(rowData, sectionID, rowID, fieldValue);
                })()}
            </View>
        )
    },
    _renderRowContent: function (rowData:object, sectionID:number, rowID:number, fieldValue) {
        if (rowData.type == 'helpText') {
            return (
                <Text style={styles.textHelper}>
                    {rowData.text}
                </Text>
            )
        }
        else if (rowData.type == 'textInput') {
            return this._renderTextInput(rowData, sectionID, rowID, fieldValue);
        }
        else if (rowData.type == 'switch') {
            return this._renderSwitch(rowData, sectionID, rowID, fieldValue);
        }
        else if (rowData.type == 'button') {
            return this._renderButton(rowData, sectionID, rowID, fieldValue);
        }
        else if (rowData.type == 'select') {
            return this._renderSelect(rowData, sectionID, rowID, fieldValue);
        }
        else if (rowData.type == 'spacer') {
            return (
                <View style={{height: 15}}/>
            )
        }
        else if (rowData.type == 'title') {
            return (
                <Text style={{color: "#ff9900", marginTop: 20, marginBottom: -7}}>{rowData.title}</Text>
            )
        }
        else if (rowData.type == 'separator' || 'seperator') {
            return (
                <View style={{borderColor: '#E6E6E6', borderBottomWidth: 0.5, marginTop: 15, marginRight: -20}}></View>
            )
        }
    },
    _renderTextInput: function (rowData:object, sectionID:number, rowID:number, fieldValue) {
        if (fieldValue == 'number') {
            fieldValue = fieldValue.toString();
        }
        console.log(fieldValue);
        var textInputID = this.counters.textInput;
        this.counters.textInput++;
        var label = (rowData.label) ? <Text style={styles.inputLabel}>{rowData.label}</Text> : null;
        return (
            <View>
                {label}
                <TextInput
                    style={styles.textInput}
                    placeholder={rowData.placeholder}
                    placeholderTextColor={'lightGray'}
                    value={fieldValue}
                    autoFocus={rowData.autoFocus}
                    secureTextEntry={rowData.secureTextEntry || false}
                    keyboardType={rowData.keyboardType || 'default'}
                    onChangeText={(text) => {
                            this.props.delegate.FMFormData[rowData.reference] = text;
                            this.formShouldReload();
                        }}
                    ref={(textInput) => {this.FMRefs.textInput[textInputID] = textInput;}}
                    onFocus={() => {
                            var self = this;
                            var view = this.FMRefs.textInput[textInputID];
                            setTimeout(function(){
                                view.measure((ox, oy, width, height, px, py) => {
                                    var marginToBottom = SCREEN_HEIGHT - (py + height);
                                    if(marginToBottom < self.keyBoardHeight + 20){
                                        var scrollOffset = self.keyBoardHeight - marginToBottom + 20;
                                        self.refs.listView.getScrollResponder().scrollTo(self.previousScrollOffset + scrollOffset);
                                    }
                                });
                            }, 200);
                            if(rowData.onFocus) rowData.onFocus(fieldValue);
                        }}
                    onSubmitEditing={() => {
                            if(this.props.autoFocusNextTextInput == true && textInputID < this.counters.textInput - 1){
                                this.FMRefs.textInput[textInputID + 1].focus();
                            }else{
                                this.FMRefs.textInput[textInputID].blur();
                            }
                            if(rowData.onSubmitEditing) rowData.onSubmitEditing();
                        }}
                    onBlur={() => {if(rowData.onBlur) rowData.onBlur(fieldValue)}}
                    >
                </TextInput>
            </View>
        )
    },
    _renderSwitch: function (rowData:object, sectionID:number, rowID:number, fieldValue) {
        if (fieldValue == null) {
            this.props.delegate.FMFormData[rowData.reference] = rowData.defaultValue;
        }
        var label = (rowData.label) ? <Text style={styles.inputLabel}>{rowData.label}</Text> : null;
        var buttonLabel;
        if (fieldValue == true) {
            if (rowData.onLabel) buttonLabel = rowData.onLabel;
            else buttonLabel = '是';
        } else {
            if (rowData.offLabel) buttonLabel = rowData.offLabel;
            else buttonLabel = '否';
        }
        return (
            <View>
                <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                    <View>
                        {label}
                        <Text style={styles.buttonLabel}>{buttonLabel}</Text>
                    </View>
                    <SwitchIOS
                        onValueChange={(value) => {
                                this.props.delegate.FMFormData[rowData.reference] = value;
                                this.formShouldReload();
                                if(rowData.onValueChange) rowData.onValueChange();
                            }}
                        onTintColor={'#ff9900'}
                        value={fieldValue}/>
                </View>
            </View>
        )
    },
    _renderButton: function (rowData:object, sectionID:number, rowID:number, fieldValue) {
        var label = (rowData.label) ? <Text style={styles.inputLabel}>{rowData.label}</Text> : null;
        var buttonLabel = (typeof rowData.buttonLabel == 'function') ? rowData.buttonLabel() : rowData.buttonLabel;
        return (
            <View style={{flex: 1}}>
                {label}
                <View>
                    <Text style={styles.buttonLabel}>{buttonLabel}</Text>
                </View>
            </View>
        )
    },
    _renderSelect: function (rowData:object, sectionID:number, rowID:number, fieldValue) {
        var pickerId = 'FMpicker' + sectionID + ':' + rowID;
        var options = (typeof rowData.options == 'function') ? rowData.options() : rowData.options;
        var labels = (typeof rowData.labels == 'function') ? rowData.labels() : rowData.labels;
        var buttonLabel = labels[options.indexOf(this.props.delegate.FMFormData[rowData.reference])] || '点击选择';
        var self = this;
        return (
            <View style={{flex: 1}}>
                <Text style={styles.inputLabel}>
                    {rowData.label}
                </Text>
                <View>
                    <Text style={styles.buttonLabel}>{buttonLabel}</Text>
                </View>
                <IOSBottomPicker ref={(picker) => {
                            this.listViewRefs[pickerId] = picker
                        }}
                                 options={options}
                                 labels={labels}
                    />
            </View>
        )
    }
});

var SCREEN_WIDTH = require('Dimensions').get('window').width;

var styles = StyleSheet.create({
    row: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        width: SCREEN_WIDTH,
        marginBottom: 15,
    },
    rowContent: {
        flex: 1,
        width: SCREEN_WIDTH - 40,
        justifyContent: 'center',
    },
    imageWithBorder: {
        flex: 0,
        width: 50,
        height: 50,
        marginTop: 10,
        borderRadius: 5,
    },
    inputLabel: {
        flex: 1,
        fontSize: 10,
        color: '#ff9900',
        marginBottom: 5,
    },
    textInput: {
        height: 20,
        width: SCREEN_WIDTH - 40,
        fontSize: 15,
    },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontSize: 20,
        textAlign: 'center',
        margin: 10,
        flex: 1
    },
    textHelper: {
        fontSize: 13,
        color: 'gray',
        marginLeft: 10,
        marginRight: 10,
    },
    loginButton: {
        width: 180,
        height: 32,
        fontSize: 13,
        borderRadius: 4,
        textAlign: 'center',
        backgroundColor: '#ff9900',
        color: 'white',
        padding: 8,
    },
    button: {
        height: 32,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        backgroundColor: '#ff9900',
        padding: 8,
    },
    buttonLabel: {
        fontSize: 15,
    },
    noImageButton: {
        padding: 20,
        borderWidth: 1,
        borderColor: '#ff9900',
    },
    icon: {
        flex: 0,
        marginTop: 10,
        marginLeft: 3,
    },
    accessory: {
        flex: 0,
        marginTop: 10,
        marginRight: 3,
    },
    image: {}
});

module.exports = Component;
