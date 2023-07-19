﻿using System.Drawing;
using OpenQA.Selenium;
using Applitools.Selenium.Fluent;

namespace Applitools.Selenium
{

    public static class Target
    {
        public static SeleniumCheckSettings Window()
        {
            return new SeleniumCheckSettings();
        }

        public static SeleniumCheckSettings Region(Rectangle rect)
        {
            return new SeleniumCheckSettings(rect);
        }

        public static SeleniumCheckSettings Region(Applitools.Utils.Geometry.Region region)
        {
            return new SeleniumCheckSettings(region.ToRectangle());
        }

        public static SeleniumCheckSettings Region(IWebElement element)
        {
            return new SeleniumCheckSettings(element);
        }

        public static SeleniumCheckSettings Region(By by)
        {
            return new SeleniumCheckSettings(by);
        }

        public static SeleniumCheckSettings Region(TargetPathLocator targetLocator)
        {
            return new SeleniumCheckSettings(targetLocator);
        }

        public static SeleniumCheckSettings Frame(By by)
        {
            SeleniumCheckSettings settings = new SeleniumCheckSettings();
            settings = settings.Frame(by);
            return settings;
        }

        public static SeleniumCheckSettings Frame(string frameNameOrId)
        {
            SeleniumCheckSettings settings = new SeleniumCheckSettings();
            settings = settings.Frame(frameNameOrId);
            return settings;
        }

        public static SeleniumCheckSettings Frame(int index)
        {
            SeleniumCheckSettings settings = new SeleniumCheckSettings();
            settings = settings.Frame(index);
            return settings;
        }

        public static SeleniumCheckSettings Frame(IWebElement frameReference)
        {
            SeleniumCheckSettings settings = new SeleniumCheckSettings();
            settings = settings.Frame(frameReference);
            return settings;
        }

    }
}
