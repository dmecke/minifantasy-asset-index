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
    },
    created() {
        const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRtDDaI5kVRkOUWqJb8GRksylMr-wsKKbKB6O4XQ1rhVs5weqq_7NZPltfsniDND5C17kFatv2mUtyp/pub?gid=0&single=true&output=tsv';
        makeRequest(url, data => {
            data = data.split('\r\n').slice(1).map(data => data.split('\t')).map(data => {
                return {
                    name: data[0],
                    type: data[1],
                    pack: data[2],
                    packType: data[3],
                    price: data[4],
                    link: data[5],
                    tags: data[6].split(',').map(tag => tag.trim()),
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
                        <th @click="sort('packType')" :style="{ fontStyle: sorting === 'packType' ? 'italic' : 'normal' }">Pack Type</th>
                        <th @click="sort('price')" :style="{ fontStyle: sorting === 'price' ? 'italic' : 'normal' }">Price</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="asset in filteredAssets">
                        <td :title="asset.tags.join(', ')"><a :href="asset.link" target="_blank">{{ asset.name }}</a></td>
                        <td>{{ asset.type }}</td>
                        <td>{{ asset.pack }}</td>
                        <td>{{ asset.packType }}</td>
                        <td>{{ asset.price }}</td>
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
        }
        #asset-index-container table tr th {
            cursor: pointer;
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
        if (!this.isEnabled()) {
            return;
        }

        this.appendChild(createStyle());
        this.appendChild(createContainer());
        this.appendChild(createVue());
    }

    isEnabled() {
        const urlSearchParams = new URLSearchParams(window.location.search);
        const proxy = new Proxy(urlSearchParams, { get: (searchParams, prop) => searchParams.get(prop)});

        return proxy.preview;
    }
}

customElements.define('wix-default-custom-element', WixDefaultCustomElement);
