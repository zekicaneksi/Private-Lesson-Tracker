import Layout from '../../components/Layout.js';
import { studentRoutes } from "../../utils/NavbarRoutes";

export default function Lessons() {

    return (
        <div>
            <p>hello from student - Lessons</p>
        </div>
    )
}

Lessons.getLayout = function getLayout(Lessons) {

    return (
        <Layout routes = {studentRoutes}>
            {Lessons}
        </Layout>
    );
}