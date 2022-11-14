import { backendFetchGET } from "../../utils/backendFetch";

export default function Index(props) {

    async function testFetch(){
        backendFetchGET('/testFetch',async (response) => {
            console.log(await response.json());
        });
    }

    return (
        <div>
            <p>hello from guardian {props.testProp}</p>
            <button onClick={testFetch}>testFetch</button>
        </div>
    );
}