import Layout from '../../components/Layout.js';
import { teacherRoutes } from "../../utils/NavbarRoutes";

export default function Notes() {

    return (
        <div>
            <p>hello from teacher - Notes</p>
        </div>
    )
}

Notes.getLayout = function getLayout(Notes) {

    return (
        <Layout routes = {teacherRoutes}>
            {Notes}
        </Layout>
    );
}