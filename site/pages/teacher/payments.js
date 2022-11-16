import Layout from '../../components/Layout.js';
import { teacherRoutes } from "../../utils/NavbarRoutes";

export default function Payments() {

    return (
        <div>
            <p>hello from teacher - Payments</p>
        </div>
    )
}

Payments.getLayout = function getLayout(Payments) {

    return (
        <Layout routes = {teacherRoutes}>
            {Payments}
        </Layout>
    );
}