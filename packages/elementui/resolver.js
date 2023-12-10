function kebabCase(key) {
  const result = key.replace(/([A-Z])/g, " $1").trim();
  return result.split(" ").join("-").toLowerCase();
}


function getSideEffects3(partialName, options) {
  const { importStyle = "css" } = options;
  if (!importStyle)
    return;
  if (importStyle === "sass") {
    return [
      "element-ui/packages/theme-chalk/src/base.scss",
      `element-ui/packages/theme-chalk/src/${partialName}.scss`
    ];
  } else {
    return [
      "element-ui/lib/theme-chalk/base.css",
      `element-ui/lib/theme-chalk/${partialName}.css`
    ];
  }
}
export default function(options = {}) {
  return {
    type: "component",
    resolve: (name) => {
      if (options.exclude && name.match(options.exclude))
        return;
      if (/^El[A-Z]/.test(name)) {
        const compName = name.slice(2);
        const partialName = kebabCase(compName);
        // console.log(">>>>>>>>>>",name,compName,partialName,process.env.NODE_ENV)
        if (partialName === "collapse-transition") {
          return {
            from: `element-ui/lib/transitions/${partialName}`
          };
        }
        // if(process.env.NODE_ENV === "production"){
        //   return {
        //      from: `element-ui/lib/${partialName}`,
        //      sideEffects: getSideEffects3(partialName, options)
        //   }
        // }else{
          return {
            name,
            from: `@vitescv/elementui/components`,
            // from: `element-ui/lib/${partialName}`,
            sideEffects: getSideEffects3(partialName, options)
          };
        // }
      }
    }
  };
}