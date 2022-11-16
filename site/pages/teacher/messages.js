import Layout from '../../components/Layout.js';
import { teacherRoutes } from "../../utils/NavbarRoutes";

export default function Messages() {

    return (
        <div>
            <p>hello from teacher - Messages</p>
        </div>
    )
}

Messages.getLayout = function getLayout(Messages) {

    return (
        <Layout routes = {teacherRoutes}>
            {Messages}
        </Layout>
    );
}