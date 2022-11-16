import Layout from '../../components/Layout.js';
import { teacherRoutes } from "../../utils/NavbarRoutes";

export default function Schedule() {

    return (
        <div>
            <p>hello from teacher - Schedule</p>
        </div>
    )
}

Schedule.getLayout = function getLayout(Schedule) {

    return (
        <Layout routes = {teacherRoutes}>
            {Schedule}
        </Layout>
    );
}