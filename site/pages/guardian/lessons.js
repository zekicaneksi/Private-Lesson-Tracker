import Layout from '../../components/Layout.js';
import { guardianRoutes } from "../../utils/NavbarRoutes";

export default function Lessons() {

    return (
        <div>
            <p>hello from guardian - lessons</p>
        </div>
    )
}

Lessons.getLayout = function getLayout(Lessons) {

    return (
        <Layout routes = {guardianRoutes}>
            {Lessons}
        </Layout>
    );
}