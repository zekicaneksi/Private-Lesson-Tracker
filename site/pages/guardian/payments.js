import Layout from '../../components/Layout.js';
import { guardianRoutes } from "../../utils/NavbarRoutes";

export default function Payments() {

    return (
        <div>
            <p>hello from guardian - Payments</p>
        </div>
    )
}

Payments.getLayout = function getLayout(Payments) {

    return (
        <Layout routes = {guardianRoutes}>
            {Payments}
        </Layout>
    );
}