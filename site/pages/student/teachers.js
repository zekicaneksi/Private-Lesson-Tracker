import Layout from '../../components/Layout.js';
import { studentRoutes } from "../../utils/NavbarRoutes";

export default function Teachers() {

    return (
        <div>
            <p>hello from student - Teachers</p>
        </div>
    )
}

Teachers.getLayout = function getLayout(Teachers) {

    return (
        <Layout routes = {studentRoutes}>
            {Teachers}
        </Layout>
    );
}