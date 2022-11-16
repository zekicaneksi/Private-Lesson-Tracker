import Layout from '../../components/Layout.js';
import { guardianRoutes } from "../../utils/NavbarRoutes";

export default function Students() {

    return (
        <div>
            <p>hello from guardian - Students</p>
        </div>
    )
}

Students.getLayout = function getLayout(Students) {

    return (
        <Layout routes = {guardianRoutes}>
            {Students}
        </Layout>
    );
}