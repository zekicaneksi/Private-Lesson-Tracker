import Layout from '../../components/Layout.js';
import { studentRoutes } from "../../utils/NavbarRoutes";

export default function Assignments() {

    return (
        <div>
            <p>hello from student - Assignments</p>
        </div>
    )
}

Assignments.getLayout = function getLayout(Assignments) {

    return (
        <Layout routes = {studentRoutes}>
            {Assignments}
        </Layout>
    );
}