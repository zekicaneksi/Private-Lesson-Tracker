import Layout from '../../components/Layout.js';
import { studentRoutes } from "../../utils/NavbarRoutes";

export default function Guardians() {

    return (
        <div>
            <p>hello from student - Guardians</p>
        </div>
    )
}

Guardians.getLayout = function getLayout(Guardians) {

    return (
        <Layout routes = {studentRoutes}>
            {Guardians}
        </Layout>
    );
}