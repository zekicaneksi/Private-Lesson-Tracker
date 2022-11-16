import Layout from '../../components/Layout.js';
import { teacherRoutes } from "../../utils/NavbarRoutes";

export default function Lessons() {

    return (
        <div>
            <p>hello from teacher - Lessons</p>
        </div>
    )
}

Lessons.getLayout = function getLayout(Lessons) {

    return (
        <Layout routes = {teacherRoutes}>
            {Lessons}
        </Layout>
    );
}