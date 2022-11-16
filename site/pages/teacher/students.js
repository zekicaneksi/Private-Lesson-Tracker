import Layout from '../../components/Layout.js';
import { teacherRoutes } from "../../utils/NavbarRoutes";

export default function Students() {

    return (
        <div>
            <p>hello from teacher - Students</p>
        </div>
    )
}

Students.getLayout = function getLayout(Students) {

    return (
        <Layout routes = {teacherRoutes}>
            {Students}
        </Layout>
    );
}