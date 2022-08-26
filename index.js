const createVue = () => {
    const element = document.createElement('script');
    element.src = 'https://unpkg.com/vue@3.2.37/dist/vue.global.prod.js';
    element.onload = () => {
        const { createApp } = Vue;

        createApp({
            components: {
                search: searchComponent,
                listing: listingComponent,
            },
            data() {
                return {
                    q: '',
                }
            },
            template: `
                <div>
                    <search @changedQuery="this.q = $event"></search>
                    <listing :q="q"></listing>
                </div>
            `
        }).mount('#app');
    }

    return element;
}

const searchComponent = {
    data() {
        return {
            q: '',
        }
    },
    template: `
        <label>
            Search
            <input type="text" v-model="q" @input="$emit('changedQuery', this.q)" style="margin-bottom: 25px;" />
        </label>
    `
}

const listingComponent = {
    props: ['q'],
    data() {
        return {
            assets: [],
            sorting: 'name',
            sortingOrder: 'asc',
        }
    },
    methods: {
        sort(column) {
            if (this.sorting === column) {
                this.sortingOrder = this.sortingOrder === 'asc' ? 'desc' : 'asc';
            }
            this.sorting = column;
        },
        open(link) {
            window.open(link, '_blank');
        },
    },
    created() {
        const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRtDDaI5kVRkOUWqJb8GRksylMr-wsKKbKB6O4XQ1rhVs5weqq_7NZPltfsniDND5C17kFatv2mUtyp/pub?gid=0&single=true&output=tsv';
        makeRequest(url, data => {
            data = data.split('\r\n').slice(1).map(data => data.split('\t')).map(data => {
                const store = [];
                if (data[4] === 'yes') {
                    store.push('itch');
                }
                if (data[5] === 'yes') {
                    store.push('unity');
                }
                if (data[6] === 'yes') {
                    store.push('patreon');
                }

                return {
                    name: data[0],
                    type: data[1],
                    pack: data[2],
                    store: store.join('_') + '.png',
                    link: data[7],
                    tags: data[8].split(',').map(tag => tag.trim()),
                }
            });
            this.assets = data;
        });
    },
    computed: {
        filteredAssets() {
            return this
                .assets
                .filter(asset => {
                    const query = this.q.toLowerCase().split(' ');

                    return query.length === query.filter(q => {
                        if (asset.name.toLowerCase().includes(q)) {
                            return true;
                        }

                        if (asset.pack.toLowerCase().includes(q)) {
                            return true;
                        }

                        if (asset.type.toLowerCase().includes(q)) {
                            return true;
                        }

                        if (asset.tags.filter(tag => tag.toLowerCase().includes(q)).length > 0) {
                            return true;
                        }

                        return false;
                    }).length;
                })
                .sort((a, b) => a[this.sorting].toLowerCase().localeCompare(b[this.sorting].toLowerCase()) * (this.sortingOrder === 'asc' ? 1 : -1))
            ;
        }
    },
    template: `
        <div>
            <table v-if="assets.length > 0">
                <thead>
                    <tr>
                        <th @click="sort('name')" :style="{ fontStyle: sorting === 'name' ? 'italic' : 'normal' }">Name</th>
                        <th @click="sort('type')" :style="{ fontStyle: sorting === 'type' ? 'italic' : 'normal' }">Type</th>
                        <th @click="sort('pack')" :style="{ fontStyle: sorting === 'pack' ? 'italic' : 'normal' }">Pack</th>
                        <th @click="sort('store')" :style="{ fontStyle: sorting === 'store' ? 'italic' : 'normal' }">Store</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="asset in filteredAssets"
                        :title="asset.tags.join(', ')"
                        @click="open(asset.link)"
                    >
                        <td>{{ asset.name }}</a></td>
                        <td>{{ asset.type }}</td>
                        <td>{{ asset.pack }}</td>
                        <td><img :src="'https://dmecke.github.io/minifantasy-asset-index/' + asset.store" /></td>
                    </tr>
                </tbody>
            </table>
            <div v-else>Loading asset data...</div>
        </div>
    `
}

const makeRequest = (url, callback) => {
    const request = new XMLHttpRequest();
    request.onreadystatechange = () => {
        if (request.readyState === 4 && request.status === 200) {
            callback(request.response);
        }
    }
    request.open('get', url, true);
    request.send();
}

const createStyle = () => {
    const style = document.createElement('style');
    style.innerHTML = `
        wix-default-custom-element {
            display: flex;
        }
        #asset-index-container {
            width: 100%;
            color: #f6f4f0;
            font-family: avenir-lt-w01_35-light1475496,avenir-lt-w05_35-light,sans-serif;
            font-size: 17px;
            padding: 25px;
        }
        #asset-index-container a {
            color: #f6f4f0;
        }
        #asset-index-container table {
            width: 100%
        }
        #asset-index-container table tr {
            text-align: left;
            height: 25px;
            cursor: pointer;
        }
        #asset-index-container table tbody tr:nth-child(odd) {
            background-color: #f6f4f020;
        }
        #asset-index-container table tr:hover {
            background-color: #ff4f4f !important;
        }
        #asset-index-container table tr td {
            padding: 4px;
        }
        #asset-index-container table tr th {
            cursor: pointer;
            padding: 4px;
        }
    `;

    return style;
};

const createApp = () => {
    const element = document.createElement('div');
    element.id = 'app';

    return element;
}

const createContainer = () => {
    const element = document.createElement('div');
    element.id = 'asset-index-container';
    element.style.cssText = `
        border: 2px solid #f6f4f0;
        border-radius: 25px;
    `;
    element.appendChild(createApp());

    return element;
}

class WixDefaultCustomElement extends HTMLElement {
    connectedCallback() {
        this.appendChild(createStyle());
        this.appendChild(createContainer());
        this.appendChild(createVue());
    }
}

customElements.define('wix-default-custom-element', WixDefaultCustomElement);
