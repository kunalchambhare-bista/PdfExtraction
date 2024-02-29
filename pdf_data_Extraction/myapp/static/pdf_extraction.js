const {useState} = React;
debugger
const PdfForm = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [extractedData, setExtractedData] = useState(null);
    const [imageUrls, setImageUrls] = useState([]);
    const [view, setView] = useState('fields');
    const json_data = {
        "BillingAddress": {
            "house_number": "1",
            "po_box": null,
            "road": "PRESIDENTS CHOICE CIRCLE",
            "city": "BRAMPTON",
            "state": "ON",
            "postal_code": "L6Y 5S5",
            "country_region": "CA",
            "street_address": "1 PRESIDENTS CHOICE CIRCLE",
            "unit": null,
            "city_district": null,
            "state_district": null,
            "suburb": null,
            "house": null,
            "level": null
        },
        "BillingAddressRecipient": "LOBLAW INC.",
        "CustomerId": "2471916380022",
        "CustomerName": "LOBLAW INC.",
        "InvoiceTotal": {
            "amount": 2903.04,
            "symbol": "$",
            "code": "CAD"
        },
        "PaymentTerm": "Prepaid (by Seller)",
        "ServiceAddress": {
            "house_number": "1724",
            "po_box": null,
            "road": "115 Avenue N.E.",
            "city": "Calgary",
            "state": "AB",
            "postal_code": "T3K 0P9",
            "country_region": "CA",
            "street_address": "1724 115 Avenue N.E.",
            "unit": null,
            "city_district": null,
            "state_district": null,
            "suburb": null,
            "house": null,
            "level": null
        },
        "ServiceAddressRecipient": "D022 Calgary Northpoint Main SLoc",
        "ShippingAddress": {
            "house_number": "1724",
            "po_box": null,
            "road": "115 Avenue N.E.",
            "city": "Calgary",
            "state": "AB",
            "postal_code": "T3K 0P9",
            "country_region": "CA",
            "street_address": "1724 115 Avenue N.E.",
            "unit": null,
            "city_district": null,
            "state_district": null,
            "suburb": null,
            "house": null,
            "level": null
        },
        "ShippingAddressRecipient": "D022 Calgary Northpoint Main SLoc",
        "Line Items": [
            {
                "Amount": {
                    "amount": 1451.52,
                    "symbol": null,
                    "code": "CAD"
                },
                "Description": "Item Detail: INFD ORG ALM NUGETS IN\nPack: 6\nSize: 300.0",
                "ProductCode": "000000000021335440",
                "Quantity": 32,
                "Unit": "Case",
                "UnitPrice": {
                    "amount": 45.36,
                    "symbol": null,
                    "code": "CAD"
                }
            },
            {
                "Amount": {
                    "amount": 1451.52,
                    "symbol": null,
                    "code": "CAD"
                },
                "Description": "Item Detail: INFD DC CLUSTERS W\nPack: 6\nSize: 300.0",
                "ProductCode": "000000000021335435",
                "Quantity": 32,
                "Unit": "Case",
                "UnitPrice": {
                    "amount": 45.36,
                    "symbol": null,
                    "code": "CAD"
                }
            }
        ]
    }


    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        setSelectedFile(file);
        if (file) {
            renderPDF(file)
            await handleExtractData(file);
        }
    };

    const renderPDF = (file) => {

        const fileURL = URL.createObjectURL(file);

        pdfjsLib.getDocument(fileURL).promise.then(function (pdf) {
            // Get the total number of pages in the PDF
            const totalPages = pdf.numPages;

            // Prepare an array to hold the image URLs
            const updatedImageUrls = [];

            // Convert each page to an image URL
            for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
                pdf.getPage(pageNumber).then(function (page) {
                    const viewport = page.getViewport({scale: 2});

                    // Prepare a canvas element to render the page as an image
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    // Render the page on the canvas
                    const renderContext = {
                        canvasContext: context,
                        viewport: viewport,
                    };
                    page.render(renderContext).promise.then(function () {
                        // Convert the canvas to a data URL (PNG format)
                        const imageUrl = canvas.toDataURL('image/png');

                        // Add the image URL to the array
                        updatedImageUrls.push(imageUrl);

                        // If all pages are rendered, update the state with the image URLs
                        if (updatedImageUrls.length === totalPages) {
                            setImageUrls(updatedImageUrls);
                        }
                    });
                });
            }
        });

    };

    const handleExtractData = async (file) => {
        setLoading(true);
        if (file) {
            try {
                const formData = new FormData();
                formData.append('pdf_file', file);

                const csrftoken = getCookie('csrftoken');

                const response = await fetch('http://127.0.0.1:8000/do_extract/', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRFToken': csrftoken,
                    },
                });
                if (response.ok) {
                    // const result = json_data;
                    const result = await response.json();
                    setExtractedData(result['Form Recognizer Result'])
                    setExtractedData(createTableFromJson(result['Form Recognizer Result']));
                    // setExtractedData(createTableFromJson(result));
                    console.log('Form Recognizer Result:', result);
                } else {
                    console.error('Error processing PDF:', response.statusText);
                }
            } catch (error) {
                console.error('Error processing PDF:', error.message);
            }
        } else {
            alert('No PDF file selected');
        }
        setLoading(false);
    };

    const createTableFromJson = (jsonData) => {

        var simpleTable = document.createElement("table");
        simpleTable.classList.add("main-table"); // Add class to the main table

        var simpleThead = document.createElement("thead");
        let simpleHrow = document.createElement("tr");
        let simpleKeyCell1 = document.createElement("th");
        simpleKeyCell1.textContent = 'Fields';
        var simpleKeyCell2 = document.createElement("th");
        simpleKeyCell2.textContent = 'Values';
        simpleHrow.appendChild(simpleKeyCell1);
        simpleHrow.appendChild(simpleKeyCell2);
        simpleThead.appendChild(simpleHrow);

        var simpleTbody = document.createElement("tbody");
        simpleTable.appendChild(simpleThead);
        simpleTable.appendChild(simpleTbody);

        var complexTable = document.createElement("table");
        complexTable.classList.add("main-table"); // Add class to the main table

        // var complexThead = document.createElement("thead");
        // let complexHrow = document.createElement("tr");
        // let complexKeyCell1 = document.createElement("th");
        // complexKeyCell1.textContent = 'Tables';
        // complexHrow.appendChild(complexKeyCell1);
        // complexThead.appendChild(complexHrow);

        var complexTbody = document.createElement("tbody");
        // complexTable.appendChild(complexThead);
        complexTable.appendChild(complexTbody);

        function createRows(data) {
            for (let key in data) {
                if (data.hasOwnProperty(key)) {
                    var row = document.createElement("tr");
                    var valueCell = document.createElement("td");

                    var value = data[key];

                    if (Array.isArray(value)) {

                        let subTable = createListTable(value);
                        valueCell.appendChild(subTable);

                        row.appendChild(valueCell);
                        complexTbody.appendChild(row);
                    } else if (typeof value === "object" && value !== null) {

                        let keyCell = document.createElement("td");
                        keyCell.textContent = key;
                        row.appendChild(keyCell);

                        valueCell.innerHTML = Object.entries(value)
                            .map(([nestedKey, nestedValue]) => nestedValue !== null ? `<b>${formatNestedKey(nestedKey)}:</b> ${nestedValue}` : '')
                            .join('   ');

                        function formatNestedKey(key) {
                            return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                        }

                        row.appendChild(valueCell);
                        simpleTbody.appendChild(row);
                    } else {
                        let keyCell = document.createElement("td");
                        keyCell.textContent = key;
                        row.appendChild(keyCell);

                        valueCell.textContent = value;

                        row.appendChild(valueCell);
                        simpleTbody.appendChild(row);
                    }
                }
            }
        }

        function createListTable(list) {
            var listTable = document.createElement("table");
            var listTbody = document.createElement("tbody");
            listTable.appendChild(listTbody);

            if (list.length > 0) {
                var headerRow = document.createElement("tr");
                for (var key in list[0]) {
                    if (list[0].hasOwnProperty(key)) {
                        var th = document.createElement("th");
                        th.textContent = key;
                        headerRow.appendChild(th);
                    }
                }
                listTbody.appendChild(headerRow);

                list.forEach(function (item) {

                    var dataRow = document.createElement("tr");
                    for (var key in item) {

                        let value = item[key]
                        var td = document.createElement("td");
                        if (Array.isArray(value)) {
                            let subTable = createListTable(value);
                            td.appendChild(subTable);
                        } else if (typeof value === "object" && value !== null) {

                            // let subTable = createNestedTable(value);
                            // td.appendChild(subTable);
                            //

                            td.innerHTML = Object.entries(value)
                                .map(([nestedKey, nestedValue]) => nestedValue !== null ? `<b>${formatNestedKey(nestedKey)}:</b> ${nestedValue}` : '')
                                .join('   ');

                            function formatNestedKey(key) {
                                return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                            }

                        } else {
                            td.textContent = value;
                        }
                        dataRow.appendChild(td);

                    }
                    listTbody.appendChild(dataRow);
                });
            }

            return listTable;
        }

        function createNestedTable(data) {
            var nestedTable = document.createElement("table");
            nestedTable.classList.add("nested-table"); // Add class to the table

            var nestedTbody = document.createElement("tbody");
            var headerRow = document.createElement("tr");
            headerRow.classList.add("nested-header-row"); // Add class to the header row
            var dataRow = document.createElement("tr");
            dataRow.classList.add("nested-data-row"); // Add class to the data row

            for (let key in data) {
                var th = document.createElement("th");
                th.textContent = key;
                headerRow.appendChild(th);

                var td = document.createElement("td");

                var value = data[key];
                if (Array.isArray(value)) {
                    let subTable = createListTable(value);
                    td.appendChild(subTable);
                } else if (typeof value === "object" && value !== null) {
                    let subTable = createNestedTable(value);
                    td.appendChild(subTable);
                } else {
                    td.textContent = value;
                }
                dataRow.appendChild(td);
            }

            nestedTbody.appendChild(headerRow);
            nestedTbody.appendChild(dataRow);
            nestedTable.appendChild(nestedTbody);

            return nestedTable;
        }


        createRows(jsonData);
        return {
            fieldsTable: simpleTable.outerHTML,
            tablesTable: complexTable.outerHTML
        };
    };

    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    };


    return (
        <div id="pdf-form-container">
            <form>
                <div className="input-container">
                    <input type="file" accept=".pdf" onChange={handleFileChange}/>
                </div>
            </form>

            <div className="layout-container">
                <div className="pdf-container">
                    {/*<h2>PDF Viewer</h2>*/}
                    <div className="pdf-viewer">
                        <p>{selectedFile ? `File: ${selectedFile.name}` : 'No PDF selected'}</p>
                        {imageUrls.map((imageUrl, index) => (
                            <img className="pdf-img" key={index} src={imageUrl} alt={`Page ${index + 1}`}/>
                        ))}
                    </div>
                </div>

                <div className="data-container">
                    <h2>Extracted Data</h2>
                    {loading && (
                        <div className="loading-overlay">
                            <div className="loading-icon">Analyzing...</div>
                        </div>
                    )}
                    {extractedData && (
                        <div className="buttons-container">
                            <button className={view === 'fields' ? 'active' : ''} onClick={() => setView('fields')}>
                                View Fields
                            </button>
                            <button className={view === 'tables' ? 'active' : ''} onClick={() => setView('tables')}>
                                View Tables
                            </button>
                        </div>

                    )}

                    {extractedData && (
                        <div className="table-container"
                             dangerouslySetInnerHTML={{__html: extractedData[view + 'Table']}}></div>)}
                </div>
            </div>

            {!selectedFile && (
                <div className="watermark">Select a PDF file to view and extract data.</div>
            )}
        </div>
    );
};

ReactDOM.render(React.createElement(PdfForm), document.getElementById('root'));
