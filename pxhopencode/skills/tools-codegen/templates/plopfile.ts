// plopfile.ts
import { NodePlopAPI } from "plop";

export default function (plop: NodePlopAPI) {
  plop.setGenerator("component", {
    description: "Create a React component",
    prompts: [
      { type: "input", name: "name", message: "Component name:" },
      { type: "confirm", name: "withStory", message: "Include Storybook story?" },
    ],
    actions: (data) => {
      const actions = [{
        type: "add",
        path: "src/components/{{pascalCase name}}/{{pascalCase name}}.tsx",
        templateFile: "templates/component.tsx.hbs",
      }];
      if (data?.withStory) {
        actions.push({
          type: "add",
          path: "src/components/{{pascalCase name}}/{{pascalCase name}}.stories.tsx",
          templateFile: "templates/story.tsx.hbs",
        });
      }
      return actions;
    },
  });
}
