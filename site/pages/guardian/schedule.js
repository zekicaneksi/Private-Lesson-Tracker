import Layout from '../../components/Layout.js';
import { guardianRoutes } from "../../utils/NavbarRoutes";

export default function Schedule() {

    return (
        <div>
            <p>hello from guardian - schedule</p>
        </div>
    )
}

Schedule.getLayout = function getLayout(Schedule) {

    return (
        <Layout routes = {guardianRoutes}>
            {Schedule}
        </Layout>
    );
}