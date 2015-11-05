
var React = require('react-native');
var Spinner = require('react-native-spinkit');
var {
    View,
    Image,
    Animated,
    StyleSheet
} = React;

var Component = React.createClass({
    getInitialState: function(){
        return {
            indicatorOpacity: new Animated.Value(1), // init opacity 0
            showIndicator: false,
            isLoading: true,
        };
    },
    _onLoadStart: function(){
        this.setState({isLoading: true});
        var self = this;
        setTimeout(function(){
            if(self.state.isLoading == true){
                self.setState({showIndicator: true});
            }
        }, 200);
    },
    _onLoadEnd: function(){
        var self = this;
        this.setState({isLoading: false});
        setTimeout(function(){
            if(self.state.showIndicator == true){
                Animated.timing(          // Uses easing functions
                    self.state.indicatorOpacity,    // The value to drive
                    {
                        toValue: 0,
                        duration: 200
                    }           // Configuration
                ).start();
            }
        }, 200)
    },
    render: function(){
        var indicator = null;
        var style = this.props.style;
        if(this.state.showIndicator){
            indicator =
            <Animated.View style={[styles.container, {flex:1, backgroundColor:'white',opacity: this.state.indicatorOpacity}]}>
                <Spinner
                    isVisible={true}
                    size={this.props.indicatorSize || 35}
                    type={'ThreeBounce'}
                    color={'#ff9900'}
                    style={{marginBottom: this.props.indicatorSize / 5 || 9}}
                    />
            </Animated.View>
            style = [styles.container, this.props.style]
        }
        return (
            <View style={[styles.container]}>
                <Image
                    style={this.props.style}
                    source={this.props.source}
                    onLoadStart={this._onLoadStart}
                    onLoadEnd={this._onLoadEnd}
                    >
                    {indicator}
                </Image>
            </View>
        )
    }
})

var styles = StyleSheet.create({
    container: {
        flex: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        color: '#ff9900'
    },
    spinner: {
    },
})
module.exports = Component;
