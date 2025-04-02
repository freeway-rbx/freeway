# Freeway -- 100x faster asset iteration on Roblox

Please visit [https://freeway-rbx.app](https://freeway-rbx.app) for how-tos and product details. 


### Installation 


1. [Download and install Freeway app](https://github.com/freeway-rbx/freeway/releases)
2. Open the working folder from the app start screen, place you images and obj meshes there
3. Open Roblox Studio, click Plugins, and click Freeway.
4. Follow the instructions in the plugin. 


### Note on meshes support
Freeway only understands single-mesh GLB and OBJ files(for now). If your GLB or OBJ contains more than one mesh, Freeway will pick the first one. It also can't decimate meshes(yet!), so please make sure your mesh fits the Roblox verts count limit.  





#### For contributors 

App development requires [nodejs](https://nodejs.org). Please install it first.

Install dependencies:

```bash
npm install
```

Run

```bash
npm run dev
```
