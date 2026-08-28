interface StaticAssets {
  fetch(request: Request): Promise<Response>;
}

interface WorkerEnv {
  ASSETS: StaticAssets;
}

export default {
  fetch(request: Request, env: WorkerEnv): Promise<Response> {
    return env.ASSETS.fetch(request);
  },
};
