/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 */
'use strict';

var React = require('react-native');
var FMForm = require('./FMForm');
var {
    AppRegistry,
    StyleSheet,
    Text,
    View,
    AlertIOS,
    } = React;

var example = React.createClass({
    render: function () {
        return (
            <View style={styles.container}>
                <FMForm
                    schema={this._genSchema}
                    delegate={this}
                    ref={'form'}
                    style={{marginTop: 50}}
                    initData={{
                        custom: 0,
                    }}
                    />
            </View>
        );
    },
    _genSchema: function(){
        var self = this;
        return [
            {
                type: 'helpText',
                text: 'Thank you for choosing FM Form, you can create a form page within minutes using FM Form. (I am a help text)',
            },
            {
                type: 'textInput',
                label: 'Text Input',
                placeholder: 'I am a Text Input',
                reference: 'textInput'
            },
            {
                type: 'button',
                label: 'Button',
                buttonLabel: function(){
                    return "I am a button, click me!"
                },
                onClick: function(){
                    AlertIOS.alert('Button clicked');
                }
            },
            {
                type: 'switch',
                label: 'Switch',
                onLabel: 'I am a switch, I am on',
                offLabel: 'I am a switch, I am off',
                reference: 'switch',
            },
            {
                type: 'select',
                label: 'Select',
                reference: 'minLimit',
                options: [
                    '1', '2'
                ],
                labels:
                [
                    'option 1', 'option 2'
                ],
                defaultButtonLabel: 'I am a select, click me!'
            },
            {
                type: 'spacer'
            },
            {
                type: 'picture',
                labelWithNoPicture: 'I am an image picker',
                reference: 'image',
            },
            {
                type: 'custom',
                reference: 'custom',
                renderRow:function(rowData:object, sectionID:number, rowID:number, fieldValue){
                    return (
                        <Text
                            style={{color: 'red'}}
                            onPress={()=>{
                                self.FMFormData['custom'] ++;
                                self.refs.form.formShouldReload();
                            }}
                            >I am a custom row, my value is: {fieldValue}, click me!</Text>
                    )
                }
            },
        ]
    },
});

var styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    welcome: {
        fontSize: 20,
        textAlign: 'center',
        margin: 10,
    },
    instructions: {
        textAlign: 'center',
        color: '#333333',
        marginBottom: 5,
    },
});

AppRegistry.registerComponent('example', () => example);
