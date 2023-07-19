import xml.etree.ElementTree as ET
import os
import re
import datetime
import json

def upSemanticVersion(currentVersion, part):
    versionPattern = r"(?P<major>[0-9]+)\.(?P<minor>[0-9]+)(\.(?P<patch>[0-9]+))?"
    matches = re.search(versionPattern, currentVersion)
    if matches:
        vMajor = int(matches.group('major'))
        vMinor = int(matches.group('minor'))
        vPatchStr = matches.group('patch')
        if vPatchStr:
            vPatch = int(vPatchStr)
        else:
            vPatch = 0
        vNext = "{}.{}"
        partPattern = r"(?P<partName>[a-z]+)(\+(?P<increase>[0-9]+))?"
        matches = re.match(partPattern, part)
        if matches:
            vPart = matches.group('partName')
            vIncreaseStr = matches.group('increase')
            if vIncreaseStr:
                vIncrease = int(vIncreaseStr)
            else:
                vIncrease = 1
            if (vPart == "major"):
                vNext = vNext.format(vMajor + vIncrease, 0)
            elif (vPart == "minor"):
                vNext = vNext.format(vMajor, vMinor + vIncrease)
            else:
                vNext = (vNext+".{}").format(vMajor, vMinor, vPatch + 1)
        else:
            vNext = part
    return vNext

def getDependentPackages(packageName, packageNextVersions, versionPart):
    packageDependencies = {
        "Eyes.Image.Core": ["Eyes.Images"],
        "Eyes.Images": ["Eyes.Selenium", "Eyes.Selenium4", "Eyes.Playwright"],
        "Eyes.Selenium": ["Eyes.Appium"],
    }
    dependencyDefaultChangelogStr="### Updated\n- Match to latest {}\n"
    dependentPackages = packageDependencies.get(packageName)
    if dependentPackages:
        for dependentPackageName in dependentPackages:
            if not dependentPackageName in packageNextVersions:
                packageNextVersions[dependentPackageName] = {
                    "version_part": versionPart, "changelog": dependencyDefaultChangelogStr.format(packageName)
                    }
                getDependentPackages(dependentPackageName, packageNextVersions, versionPart)

def collect_changes():

    packageLastVersions = {}
    packageNextVersions = {}

    originalLines = ""

    f = open("CHANGELOG.md", "r")
    lastVNextPackageName = False
    vNextPattern = r"^## \[(?P<PackageName>.*)? vNext( (?P<VersionPart>.*))?\]$"
    vUpdatedPattern = r"^## \[(?P<PackageName>.*)? (?P<Version>(([0-9]+)\.?)+)\] - UPDATED$"
    vLastPattern = r"^## \[(?P<PackageName>.*)? (?P<Version>(([0-9]+)\.?)+)\] - .*$"
    for line in f:
        matches = re.search(vNextPattern, line)
        if matches:
            packageName = matches.group('PackageName')
            versionPart = matches.group('VersionPart')
            if versionPart is None:
                versionPart = "minor"
            lastVNextPackageName = packageName
            packageNextVersions[packageName] = {
                "version_part": versionPart, "changelog": ""}
            getDependentPackages(packageName, packageNextVersions, versionPart)
        else:
            matches = re.search(vUpdatedPattern, line)
            if matches:
                packageName = matches.group('PackageName')
                version = matches.group('Version')
                lastVNextPackageName = packageName
                packageNextVersions[packageName] = {
                    "version_part": version, "changelog": ""}
                getDependentPackages(packageName, packageNextVersions, "minor")
            else:
                matches = re.search(vLastPattern, line)
                if matches:
                    originalLines += line
                    lastVNextPackageName = None
                    packageName = matches.group('PackageName')
                    version = matches.group('Version')
                    if not packageName in packageLastVersions:
                        packageLastVersions[packageName] = version
                else:
                    if lastVNextPackageName:
                        if (lastVNextPackageName in packageNextVersions) and (line != "\n"):
                            packageNextVersions[lastVNextPackageName]["changelog"] += line
                    else:
                        originalLines += line

    f.close()

    for (p, v) in packageNextVersions.items():
        vLast = packageLastVersions[p]
        vNext = upSemanticVersion(vLast, v["version_part"])
        v["version"] = vNext
        packageNextVersions[p] = v
    
    return {"next": packageNextVersions, "orig": originalLines}

def update_csproj(name, version_data, release_notes_data):
    xmlfile = name+".DotNet/"+name+".DotNet.csproj"
    tree = ET.parse(xmlfile)
    root = tree.getroot()
    release_notes = root.find('.//PackageReleaseNotes')
    version = root.find('.//Version')
    if release_notes is None:
        print("Could not find the PackageReleaseNotes section in " + xmlfile + "!")
        exit(1)
    if version is None:
        print("Could not find the Version section in " + xmlfile + "!")
        exit(2)
    release_notes.text = release_notes_data
    version.text = version_data
    tree.write(xmlfile)
    print(xmlfile + ": PackageReleaseNotes and Version update done!")

def create_send_mail_json(reported_version, recent_changes):
    f = open("testCoverageGap.txt", "r")
    testCoverageGap = f.read()
    f.close()

    sendMailObj = {
		"sdk": "dotnet",
		"version": reported_version,
		"changeLog": recent_changes,
		"testCoverageGap": testCoverageGap
	}

    specificRecipient = os.environ.get('SPECIFIC_RECIPIENT')
    if specificRecipient is not None:
        sendMailObj["specificRecipient"] = specificRecipient

    return json.dumps(sendMailObj)

if __name__ == '__main__':
    data = collect_changes()
    packageNextVersions = data["next"]
    originalLines = data["orig"]
    newLines = ""
    updated_projects = []
    new_tags = []
    reported_version = "RELEASE_CANDIDATE"
    dateStr = datetime.datetime.now().strftime("%Y-%m-%d")

    for (p,v) in packageNextVersions.items():
        newLines += "## [" + p + " " + v['version'] + "] - " + dateStr + "\n"
        newLines += v['changelog'] + "\n"
        update_csproj(p, v['version'], v['changelog'])
        new_tags.append(p + "@" + v['version'] + "\n")
        updated_projects.append(p + "\n")
        reported_version += ";" + p + "@" + v['version']
    
    f = open("RECENT_CHANGES.md", "w")
    f.write(newLines)
    f.close()

    sendMailStr = create_send_mail_json(reported_version, newLines);
    f = open("SEND_MAIL.json", "w")
    f.writelines(sendMailStr)
    f.close()

    newLines += originalLines
    
    f = open("CHANGELOG.md", "w")
    f.write(newLines)
    f.close()

    f = open("NEW_TAGS.txt", "w")
    f.writelines(new_tags)
    f.close()

    f = open("UPDATED_PROJECTS.txt", "w")
    f.writelines(updated_projects)
    f.close()