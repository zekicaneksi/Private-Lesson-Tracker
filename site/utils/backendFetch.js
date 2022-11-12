export function backendFetchGET(path, callback) {
    fetch(process.env.NEXT_PUBLIC_BACKEND_ADDRESS + path)
        .then((response) => response.json())
        .then((data) => callback(data));
}

export function backendFetchPOST(path, data, callback) {
    fetch(process.env.NEXT_PUBLIC_BACKEND_ADDRESS + path, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
        .then((response) => response.json())
        .then((data) => {
          callback(data);
        })
        .catch((error) => {
          callback(data);
        });
}