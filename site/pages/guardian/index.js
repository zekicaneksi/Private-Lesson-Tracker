import { useEffect } from 'react';
import Layout from '../../components/Layout.js';
import { guardianRoutes } from "../../utils/NavbarRoutes";

export default function Index() {

    return (
        <div>
            <p>hello from guardian homepage</p>
        </div>
    )
}

Index.getLayout = function getLayout(Index) {

    return (
        <Layout routes = {guardianRoutes}>
            {Index}
        </Layout>
    );
}