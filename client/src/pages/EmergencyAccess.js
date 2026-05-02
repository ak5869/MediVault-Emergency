import React, {Component} from "react";
import {QRCodeCanvas} from "qrcode.react";

class EmergencyAccess extends Component{
    constructor() {
        super();
        
        this.state={
            accessCount:0
        };
    }

    generateAccess = () => {
        this.setState({
            accessCount:this.state.accessCount + 1
        });
    }

    render(){
        return(
        <div>
            <h2>Emergency Access</h2>
            <QRCodeCanvas value="PATIENT123" size={200}/>
            <p>Scan this code at hospital reception</p>
            <h3>Total Access Requests: {this.state.accessCount}</h3>
            <button onClick={this.generateAccess}>
                Generate Access
            </button>
        </div>
        );

    }

}

export default EmergencyAccess;