import {useEffect, useState} from "react"

export function dashboard() {
    const [data, setData] = useState([])

    useEffect(
        function() {
            axios.get("http://localhost:8000/trends").then(
                function(answer) {
                    return setData(answer)})}, [])

    return <div>
        <h2>Postings Over Time</h2>
        
    </div>
}

