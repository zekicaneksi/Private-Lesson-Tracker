import Layout from '../../components/Layout.js';
import { teacherRoutes } from "../../utils/NavbarRoutes";

export default function Assignments() {

    return (
        <div>
            <p>hello from teacher - Assignments</p>
        </div>
    )
}

Assignments.getLayout = function getLayout(Assignments) {

    return (
        <Layout routes = {teacherRoutes}>
            {Assignments}
        </Layout>
    );
}