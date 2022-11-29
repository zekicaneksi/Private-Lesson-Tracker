import Layout from '../../components/Layout.js';
import { studentRoutes } from "../../utils/NavbarRoutes";
import { useRouter } from 'next/router.js';

export default function Messages() {

    const router = useRouter();

    console.log(router.query.user_id);

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