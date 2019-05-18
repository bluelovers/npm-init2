"use strict";
/**
 * Created by user on 2019/5/16.
 */
Object.defineProperty(exports, "__esModule", { value: true });
function setupToYargs(yargs) {
    return yargs
        .default({
    //input: process.cwd(),
    })
        .option('npmClient', {
        alias: ['N'],
        requiresArg: true,
        normalize: true,
        description: 'npm, yarn, ...etc',
        default: 'npm',
        type: 'string',
    })
        .option('yes', {
        alias: ['y', 'silent'],
        //		requiresArg: true,
        //		default: 'npm',
        type: 'boolean',
    })
        .option('cwd', {
        alias: ['C'],
        requiresArg: true,
        normalize: true,
        //		default: process.cwd(),
        defaultDescription: process.cwd(),
        type: 'string',
    })
        .option('skipCheckWorkspace', {
        alias: ['W'],
        type: 'boolean',
    })
        .option('force', {
        alias: ['f'],
        type: 'boolean',
    })
        .option('sort', {
        type: 'boolean',
        default: true,
    })
        .option('private', {
        alias: ['p'],
        type: 'boolean',
    })
        .option('createModule', {
        alias: ['m'],
        type: 'string',
    })
        .option('name', {
        type: 'string',
    })
        .option('copyStatic', {
        type: 'boolean',
    });
}
exports.setupToYargs = setupToYargs;
exports.default = setupToYargs;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieWFyZ3Mtc2V0dGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInlhcmdzLXNldHRpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOztBQUtILFNBQWdCLFlBQVksQ0FBSSxLQUFjO0lBRTdDLE9BQU8sS0FBSztTQUNWLE9BQU8sQ0FBQztJQUNSLHVCQUF1QjtLQUN2QixDQUFDO1NBQ0QsTUFBTSxDQUFDLFdBQVcsRUFBRTtRQUNwQixLQUFLLEVBQUUsQ0FBQyxHQUFHLENBQUM7UUFDWixXQUFXLEVBQUUsSUFBSTtRQUNqQixTQUFTLEVBQUUsSUFBSTtRQUNmLFdBQVcsRUFBRSxtQkFBbUI7UUFDaEMsT0FBTyxFQUFFLEtBQUs7UUFDZCxJQUFJLEVBQUUsUUFBUTtLQUNkLENBQUM7U0FDRCxNQUFNLENBQUMsS0FBSyxFQUFFO1FBQ2QsS0FBSyxFQUFFLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQztRQUN6QixzQkFBc0I7UUFDdEIsbUJBQW1CO1FBQ2hCLElBQUksRUFBRSxTQUFTO0tBQ2YsQ0FBQztTQUNELE1BQU0sQ0FBQyxLQUFLLEVBQUU7UUFDZCxLQUFLLEVBQUUsQ0FBQyxHQUFHLENBQUM7UUFDWixXQUFXLEVBQUUsSUFBSTtRQUNqQixTQUFTLEVBQUUsSUFBSTtRQUNsQiwyQkFBMkI7UUFDeEIsa0JBQWtCLEVBQUUsT0FBTyxDQUFDLEdBQUcsRUFBRTtRQUNqQyxJQUFJLEVBQUUsUUFBUTtLQUNkLENBQUM7U0FDRCxNQUFNLENBQUMsb0JBQW9CLEVBQUU7UUFDN0IsS0FBSyxFQUFFLENBQUMsR0FBRyxDQUFDO1FBQ1osSUFBSSxFQUFFLFNBQVM7S0FDZixDQUFDO1NBQ0QsTUFBTSxDQUFDLE9BQU8sRUFBRTtRQUNoQixLQUFLLEVBQUUsQ0FBQyxHQUFHLENBQUM7UUFDWixJQUFJLEVBQUUsU0FBUztLQUNmLENBQUM7U0FDRCxNQUFNLENBQUMsTUFBTSxFQUFFO1FBQ2YsSUFBSSxFQUFFLFNBQVM7UUFDZixPQUFPLEVBQUUsSUFBSTtLQUNiLENBQUM7U0FDRCxNQUFNLENBQUMsU0FBUyxFQUFFO1FBQ2xCLEtBQUssRUFBRSxDQUFDLEdBQUcsQ0FBQztRQUNaLElBQUksRUFBRSxTQUFTO0tBQ2YsQ0FBQztTQUNELE1BQU0sQ0FBQyxjQUFjLEVBQUU7UUFDdkIsS0FBSyxFQUFFLENBQUMsR0FBRyxDQUFDO1FBQ1osSUFBSSxFQUFFLFFBQVE7S0FDZCxDQUFDO1NBQ0QsTUFBTSxDQUFDLE1BQU0sRUFBRTtRQUNmLElBQUksRUFBRSxRQUFRO0tBQ2QsQ0FBQztTQUNELE1BQU0sQ0FBQyxZQUFZLEVBQUU7UUFDckIsSUFBSSxFQUFFLFNBQVM7S0FDZixDQUFDLENBQUE7QUFDSixDQUFDO0FBdERELG9DQXNEQztBQUVELGtCQUFlLFlBQVksQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSB1c2VyIG9uIDIwMTkvNS8xNi5cbiAqL1xuXG5pbXBvcnQgeWFyZ3MgPSByZXF1aXJlKCd5YXJncycpO1xuaW1wb3J0IHsgQXJndiwgT21pdCB9IGZyb20gJ3lhcmdzJztcblxuZXhwb3J0IGZ1bmN0aW9uIHNldHVwVG9ZYXJnczxUPih5YXJnczogQXJndjxUPilcbntcblx0cmV0dXJuIHlhcmdzXG5cdFx0LmRlZmF1bHQoe1xuXHRcdFx0Ly9pbnB1dDogcHJvY2Vzcy5jd2QoKSxcblx0XHR9KVxuXHRcdC5vcHRpb24oJ25wbUNsaWVudCcsIHtcblx0XHRcdGFsaWFzOiBbJ04nXSxcblx0XHRcdHJlcXVpcmVzQXJnOiB0cnVlLFxuXHRcdFx0bm9ybWFsaXplOiB0cnVlLFxuXHRcdFx0ZGVzY3JpcHRpb246ICducG0sIHlhcm4sIC4uLmV0YycsXG5cdFx0XHRkZWZhdWx0OiAnbnBtJyxcblx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdH0pXG5cdFx0Lm9wdGlvbigneWVzJywge1xuXHRcdFx0YWxpYXM6IFsneScsICdzaWxlbnQnXSxcbi8vXHRcdHJlcXVpcmVzQXJnOiB0cnVlLFxuLy9cdFx0ZGVmYXVsdDogJ25wbScsXG5cdFx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0fSlcblx0XHQub3B0aW9uKCdjd2QnLCB7XG5cdFx0XHRhbGlhczogWydDJ10sXG5cdFx0XHRyZXF1aXJlc0FyZzogdHJ1ZSxcblx0XHRcdG5vcm1hbGl6ZTogdHJ1ZSxcbi8vXHRcdGRlZmF1bHQ6IHByb2Nlc3MuY3dkKCksXG5cdFx0XHRkZWZhdWx0RGVzY3JpcHRpb246IHByb2Nlc3MuY3dkKCksXG5cdFx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHR9KVxuXHRcdC5vcHRpb24oJ3NraXBDaGVja1dvcmtzcGFjZScsIHtcblx0XHRcdGFsaWFzOiBbJ1cnXSxcblx0XHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHR9KVxuXHRcdC5vcHRpb24oJ2ZvcmNlJywge1xuXHRcdFx0YWxpYXM6IFsnZiddLFxuXHRcdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdH0pXG5cdFx0Lm9wdGlvbignc29ydCcsIHtcblx0XHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRcdGRlZmF1bHQ6IHRydWUsXG5cdFx0fSlcblx0XHQub3B0aW9uKCdwcml2YXRlJywge1xuXHRcdFx0YWxpYXM6IFsncCddLFxuXHRcdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdH0pXG5cdFx0Lm9wdGlvbignY3JlYXRlTW9kdWxlJywge1xuXHRcdFx0YWxpYXM6IFsnbSddLFxuXHRcdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0fSlcblx0XHQub3B0aW9uKCduYW1lJywge1xuXHRcdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0fSlcblx0XHQub3B0aW9uKCdjb3B5U3RhdGljJywge1xuXHRcdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdH0pXG59XG5cbmV4cG9ydCBkZWZhdWx0IHNldHVwVG9ZYXJnc1xuIl19