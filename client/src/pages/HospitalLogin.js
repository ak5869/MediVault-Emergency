import React, { useState } from "react";

function HospitalLogin() {

    const [hospital, setHospital] = useState("");
    const [staff, setStaff] = useState("");

    const login = () => {
        alert("Access Granted");
    }

    return (

        <div>
            <h2>Hospital Staff Login</h2>

            <input
                placeholder="Hospital ID"
                onChange={(e) => setHospital(e.target.value)} />

            <br />

            <input
                placeholder="Staff ID"
                onChange={(e) => setStaff(e.target.value)}
            />

            <br /><br />

            <button onClick={login}>
                Access System
            </button>

        </div>

    );

}

export default HospitalLogin;