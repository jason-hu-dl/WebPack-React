import React , {Component} from 'react';
import {connect} from "react-redux";
import * as Actions from "./redux/MyActions";

class My extends Component{
    constructor(props){
        super(props);
    }
    componentWillMount() {
        this.props.ListGet();
    }

    render(){
        let {List}= this.props;
        return(
            <div>
                我是我的
            </div>
        )
    }
}
export default connect((state) => {
    const {Home} = state;
    return {
        List:My.List
    }
},Actions)(My);