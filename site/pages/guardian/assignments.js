import Layout from '../../components/Layout.js';
import { guardianRoutes } from "../../utils/NavbarRoutes";

export default function Assignments() {

    return (
        <div>
            <p>hello from guardian - Assignments</p>
        </div>
    )
}

Assignments.getLayout = function getLayout(Assignments) {

    return (
        <Layout routes = {guardianRoutes}>
            {Assignments}
        </Layout>
    );
}