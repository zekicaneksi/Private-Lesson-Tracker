import Layout from '../../components/Layout.js';
import { teacherRoutes } from "../../utils/NavbarRoutes";

export default function Index() {

    return (
        <div>
            <p>hello from teacher homepage</p>
        </div>
    )
}

Index.getLayout = function getLayout(Index) {

    return (
        <Layout routes = {teacherRoutes}>
            {Index}
        </Layout>
    );
}