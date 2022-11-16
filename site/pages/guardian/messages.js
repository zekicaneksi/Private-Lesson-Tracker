import Layout from '../../components/Layout.js';
import { guardianRoutes } from "../../utils/NavbarRoutes";

export default function Messages() {

    return (
        <div>
            <p>hello from guardian - Messages</p>
        </div>
    )
}

Messages.getLayout = function getLayout(Messages) {

    return (
        <Layout routes = {guardianRoutes}>
            {Messages}
        </Layout>
    );
}