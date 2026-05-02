import React, { useState } from "react";
import { API } from "../api/api";

function AddPatient() {

    const [name, setName] = useState("");

    const submit = () => {
        API.post("/patient/add", { name });
        alert("Added");
    }

    return (

        <div>

            <input onChange={(e) => setName(e.target.value)} />
            <button onClick={submit}>Add</button>

        </div>

    );

}

export default AddPatient;