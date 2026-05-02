import React, { useEffect, useState } from "react";
import { API } from "../api/api";

function MedicalProfile() {

    const [data, setData] = useState([]);

    useEffect(() => {
        API.get("/patient")
            .then(res => setData(res.data));
    }, []);

    return (

        <div>

            <h2>Medical Profiles</h2>

            {data.map((p, index) => (
                <div key={index}>

                    <h3>{p.name}</h3>
                    <p>Blood: {p.bloodGroup}</p>
                    <p>Allergies: {p.allergies.join(", ")}</p>

                </div>
            ))}

        </div>

    );

}

export default MedicalProfile;