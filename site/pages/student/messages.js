import Layout from '../../components/Layout.js';
import { studentRoutes } from "../../utils/NavbarRoutes";

export default function Messages() {

    return (
        <div>
            <p>hello from student - Messages</p>
        </div>
    )
}

Messages.getLayout = function getLayout(Messages) {

    return (
        <Layout routes = {studentRoutes}>
            {Messages}
        </Layout>
    );
}