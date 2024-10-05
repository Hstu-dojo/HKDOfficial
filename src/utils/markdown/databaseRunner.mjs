import axios from "axios";
export function databaseRunner() {
    const secret = process.env.RENDER_SECRET;

    const options = {
      method: "GET",
      url: "https://api.render.com/v1/services/srv-cn9eli6n7f5s73fmp04g",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${secret}`,
      },
    };

    axios
        .request(options)
        .then(function (response) {
            console.log(response.data);
        })
        .catch(function (error) {
            console.error(error);
        });
}

