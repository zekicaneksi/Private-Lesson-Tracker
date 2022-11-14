export function backendFetchGET(path, callback) {
    fetch(process.env.NEXT_PUBLIC_BACKEND_ADDRESS + path, {
      credentials: 'include'
    })
        .then((response) => callback(response))
        .catch((error) => callback(error))
}

export function backendFetchPOST(path, data, callback) {
    fetch(process.env.NEXT_PUBLIC_BACKEND_ADDRESS + path, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      })
        .then((response) => callback(response))
        .catch((error) => {
          callback(error);
        });
}