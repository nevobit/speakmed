import * as grpc from '@grpc/grpc-js';

const { PORT, HOST } = process.env;

function main() {
    const server = new grpc.Server();
    server.bindAsync(`${HOST}:${PORT}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log(`Server running at http://0.0.0.0:${port}`);
        server.start();
    });
}

main();
