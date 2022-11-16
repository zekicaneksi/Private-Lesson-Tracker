import Layout from '../../components/Layout.js';
import { studentRoutes } from "../../utils/NavbarRoutes";

export default function Index() {

    return (
        <div>
            <p>hello from student homepage</p>
        </div>
    )
}

Index.getLayout = function getLayout(Index) {

    return (
        <Layout routes = {studentRoutes}>
            {Index}
        </Layout>
    );
}