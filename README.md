# react-native-fm-form
FM Form is a module for React Native to fast generate pages with a form. It works like Backbone forms. Using this module you can generate a page in 5 minutes!

### set up
`npm install react-native-fm-form`
or add `"react-native-fm-form" : "^0.0.1"` to your package.json and run `npm install`.

`var FMForm = require('react-native-fm-form')` to start using it.

### generate a page using FM Form:
1. right a schema for the FM Form:
_genSchema : function(){
	return [
		{
			type: 'textInput',
			lable: 'Text Input',
			reference: 'textInput'
		}
	]
}

2. Use FMForm as a React component:
render: function(){
	return (
		<View>
			<Text>This is a FM Form example</Text>
			<FMForm
                schema={this._genSchema}
                delegate={this}
                ref={'form'}
                style={{marginTop: 50}}
                initData={{
                    custom: 0,
                }}
		</View>
	)
}

### Form properties:
1. delegate: the component that owns FM Form instance. All the form value will be storing in this component.
2. initData: the initial data of different form field.
3. onFormRender: a function that will be called just after the form is rendered

### accessing form data:
The form data will be stored in this.FMFormData object of its delegate.
For example:
```
var Example = React.creatClass({
	render: function(){
		return (
			<View>
				<Text>This is a FM Form example</Text>
				<FMForm
	                schema={this._genSchema}
	                delegate={this}
	                ref={'form'}
	                style={{marginTop: 50}}
	                initData={{
	                    custom: 0,
	                }}
	             <Text onPress={this._onSubmit}>On submit</Text>
			</View>
		)
	},
	_onSubmit: function(){
		//accessing form data
		console.log(this.FMFormData);
	}
})
```

### editors: 
each editor will have a corresponding form field, which is specified by the 'reference' property.
For example, if a text input has 'name' as the reference, the input value of this field will be stored in FMFormData.name.


#### Text Input:
```
{
    type: 'textInput',
    label: 'Text Input',
    placeholder: 'I am a Text Input',
    reference: 'textInput',
    autoFocus: false,
    secureTextEntry: false,
    keyboardType: 'default',
    onChangeText: function(text){
    	console.log('input: ' + text);
	},
	onFocus: function(text){
    	console.log('text input focused');
	},
	onSubmitEditing: function(){
    	console.log('text input submitted');
	},
	onBlur: function(){
		console.log('text input blurred');
	},
},
```

#### Button:
```
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
```

#### Switch:
```
{
    type: 'switch',
    label: 'Switch',
    onLabel: 'I am a switch, I am on',
    offLabel: 'I am a switch, I am off',
    reference: 'switch',
},
```

#### Select:
```
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
```

#### Spacer:
```
{
    type: 'spacer'
},
```

#### picture:
```
{
    type: 'picture',
    labelWithNoPicture: 'I am an image picker',
    reference: 'image',
}
```
To use picture selector, you have to prepare the project with module: 


#### custom
```
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
}
```
